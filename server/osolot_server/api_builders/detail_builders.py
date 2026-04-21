from django.db.models import QuerySet
from ninja.errors import HttpError

from ..api.schemas import CollectiveDetail, MembershipDetail, UserDetail
from ..models import Collective, Membership, User
from ..permissions.collective_permissions import (
    membership_can_manage_members,
    user_visible_collective_members,
)
from ..permissions.user_permissions import mutual_collectives_with_user
from .summary_builders import collective_summary, membership_summary, user_summary


def _membership_detail(membership: Membership) -> MembershipDetail:
    return MembershipDetail(
        summary=membership_summary(membership),
        application_message=membership.application_message,
        applied_at=membership.applied_at.isoformat(),
        joined_at=membership.joined_at.isoformat() if membership.joined_at else None,
        updated_at=membership.updated_at.isoformat(),
        approved_by=(
            user_summary(membership.approved_by) if membership.approved_by else None
        ),
    )


def membership_detail_for_viewer(
    membership: Membership, viewer: User | None
) -> MembershipDetail:
    membership_detail = _membership_detail(membership)

    # Users can see all details of their own membership.
    if viewer and viewer.id == membership.user.id:
        return membership_detail

    viewer_membership = Membership.find_for(viewer, membership.collective)
    # Only users in the collective can see its members.
    if viewer_membership is None:
        raise HttpError(404, "Membership not found.")

    # Redact admin/moderator-only fields.
    if not membership_can_manage_members(viewer_membership):
        delattr(membership_detail, "applied_at")
        delattr(membership_detail, "updated_at")
        delattr(membership_detail, "application_message")
        delattr(membership_detail, "approved_by")

    return membership_detail


def _collective_detail_with_members(
    collective: Collective, members: QuerySet[Membership]
) -> CollectiveDetail:
    return CollectiveDetail(
        summary=collective_summary(collective),
        members=[membership_summary(m) for m in members],
        application_question=collective.application_question,
    )


def collective_detail_for_viewer(
    collective: Collective, viewer: User | None
) -> CollectiveDetail:
    visible_members = user_visible_collective_members(viewer, collective)
    return _collective_detail_with_members(collective, visible_members)


def user_detail_for_viewer(
    user: User, viewer: User | None
) -> UserDetail:
    return UserDetail(
        summary=user_summary(user),
        bio=user.bio,
        mutual_collectives=[collective_summary(c) for c in mutual_collectives_with_user(viewer, user)],
    )
