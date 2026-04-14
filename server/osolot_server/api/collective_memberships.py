from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from ..api_builders.detail_builders import membership_detail
from ..api_builders.summary_builders import membership_summary
from ..models import Collective, Membership
from ..permissions.collective_permissions import (
    can_manage_member_roles,
    can_manage_memberships,
    can_view_collective,
    membership_can_manage_members,
    user_visible_collective_members,
)
from ..security import JWTAuth, get_optional_user
from .schemas import (
    JoinCollectiveRequest,
    MembershipDetail,
    MembershipSummary,
    MessageOut,
    UpdateMembershipRequest,
)

collective_memberships_router = Router()


def _validate_update_membership_request(request: UpdateMembershipRequest) -> None:
    if request.status is not None and request.status not in Membership.Status.values:
        raise HttpError(400, "Invalid status.")

    if request.role is not None and request.role not in Membership.Role.values:
        raise HttpError(400, "Invalid role.")


@collective_memberships_router.get(
    "/{collective_id}/members",
    response=list[MembershipSummary],
    tags=["memberships"],
)
def list_memberships(request, collective_id: int):
    collective = get_object_or_404(Collective, id=collective_id)
    user = get_optional_user(request)
    if not can_view_collective(user, collective):
        raise HttpError(404, "Collective not found.")

    visible_members = user_visible_collective_members(user, collective)
    return [membership_summary(m) for m in visible_members]


@collective_memberships_router.post(
    "/{collective_id}/join",
    response=MembershipDetail,
    auth=JWTAuth(),
    tags=["memberships"],
)
def join_collective(request, collective_id: int, data: JoinCollectiveRequest):
    c = get_object_or_404(Collective, id=collective_id)
    user = request.auth
    if Membership.objects.filter(user=user, collective=c).exists():
        raise HttpError(400, "Already a member or have a pending application.")

    if c.admission_type == Collective.AdmissionType.OPEN:
        m = Membership.objects.create(
            collective=c,
            user=user,
            status=Membership.Status.ACTIVE,
            role=Membership.Role.MEMBER,
            joined_at=timezone.now(),
        )
    else:
        m = Membership.objects.create(
            collective=c,
            user=user,
            status=Membership.Status.PENDING,
            role=Membership.Role.MEMBER,
            application_message=data.application_message,
        )
    m = Membership.objects.select_related("user", "collective").get(pk=m.pk)
    return membership_detail(m)


@collective_memberships_router.get(
    "/{collective_id}/membership/{user_id}",
    response=MembershipDetail,
    tags=["memberships"],
)
def get_membership(request, collective_id: int, user_id: int):
    collective = get_object_or_404(Collective, id=collective_id)
    viewer = get_optional_user(request)

    user_membership = (
        user_visible_collective_members(viewer, collective)
        .filter(user_id=user_id)
        .first()
    )

    if user_membership is None:
        raise HttpError(404, "Membership not found.")

    return membership_detail(user_membership)


@collective_memberships_router.put(
    "/{collective_id}/membership/{user_id}",
    response=MembershipDetail,
    auth=JWTAuth(),
    tags=["memberships"],
)
def update_membership(
    request, collective_id: int, user_id: int, data: UpdateMembershipRequest
):
    _validate_update_membership_request(data)

    user_membership = get_object_or_404(
        Membership.objects.select_related("collective", "user"),
        collective_id=collective_id,
        user_id=user_id,
    )
    collective = user_membership.collective
    user = user_membership.user

    actor = request.auth
    if actor.id == user.id:
        actor_membership = user_membership
    else:
        actor_membership = Membership.find_for(actor, collective)
        if actor_membership is None:
            raise HttpError(403, "Not allowed.")

    updates = data.model_dump(exclude_unset=True)

    if "application_message" in updates:
        if actor.id != user.id:
            # Only pending applicants may update their own application message.
            raise HttpError(403, "Not allowed.")
        if user_membership.status != Membership.Status.PENDING:
            raise HttpError(
                400, "Only pending members can update their application message."
            )
        user_membership.application_message = data.application_message or ""

    if "status" in updates:
        if not membership_can_manage_members(actor_membership):
            raise HttpError(403, "Not allowed.")
        if (
            user_membership.status == Membership.Status.PENDING
            and data.status == Membership.Status.ACTIVE
        ):
            user_membership.joined_at = timezone.now()
            user_membership.status = data.status
        else:
            # Only allow updating status from PENDING -> ACTIVE (for now)
            pass

    if "role" in updates:
        if not can_manage_member_roles(actor_membership):
            raise HttpError(403, "Only admins can change roles.")

        collective_admins = Membership.objects.for_collective(collective).admins()
        if (
            collective_admins.count() == 1
            and collective_admins.first().id == user_membership.id
        ):
            raise HttpError(400, "Cannot demote the last admin.")
        user_membership.role = data.role

    # Handle race condition of two admins being demoted at the same time.
    # Probably overkill, and we're ignoring race conditions elsewhere, but whatever.
    with transaction.atomic():
        user_membership.save()
        if not Membership.objects.filter(
            collective=collective,
            status=Membership.Status.ACTIVE,
            role=Membership.Role.ADMIN,
        ).exists():
            raise HttpError(400, "Collective must have at least one active admin.")
    return membership_detail(user_membership)


@collective_memberships_router.delete(
    "/{collective_id}/membership/{user_id}",
    response=MessageOut,
    auth=JWTAuth(),
    tags=["memberships"],
)
def delete_membership(request, collective_id: int, user_id: int):
    user_membership = Membership.find_for_ids(user_id, collective_id)
    if user_membership is None:
        raise HttpError(404, "Membership not found.")
    collective = user_membership.collective

    actor = request.auth

    if actor.id != user_id and not can_manage_memberships(actor, collective):
        raise HttpError(403, "Not allowed.")

    num_admins = Membership.objects.for_collective(collective).admins().count()
    if user_membership.role == Membership.Role.ADMIN and num_admins <= 1:
        raise HttpError(400, "Cannot remove the last admin.")

    # Handle race condition of two admins leaving at the same time.
    # Probably overkill, and we're ignoring race conditions elsewhere, but whatever.
    with transaction.atomic():
        user_membership.delete()
        if not Membership.objects.filter(
            collective=collective,
            status=Membership.Status.ACTIVE,
            role=Membership.Role.ADMIN,
        ).exists():
            raise HttpError(400, "Collective must have at least one active admin.")

    return MessageOut(message="Member removed.")
