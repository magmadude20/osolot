from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from ..api_builders.detail_builders import collective_detail_for_viewer
from ..api_builders.summary_builders import collective_summary
from ..models import Collective, Membership
from ..permissions.collective_permissions import user_visible_collectives
from ..security import JWTAuth, get_optional_user
from .schemas import (
    CollectiveDetail,
    CollectiveSettings,
    CollectiveSummary,
    MessageOut,
)

collectives_router = Router()


# Request validation


def _validate_collective_settings(settings: CollectiveSettings) -> None:
    if settings.visibility not in Collective.Visibility.values:
        raise HttpError(400, "Invalid visibility.")

    if settings.admission_type not in Collective.AdmissionType.values:
        raise HttpError(400, "Invalid admission_type.")


# --- Collectives ---


@collectives_router.get(
    "/",
    response=list[CollectiveSummary],
    tags=["collectives"],
    description="List all collectives visible to the current user.",
)
def list_collectives(request):
    visible_collectives = user_visible_collectives(get_optional_user(request))
    return [collective_summary(c) for c in visible_collectives]


@collectives_router.post(
    "/",
    response=CollectiveDetail,
    auth=JWTAuth(),
    tags=["collectives"],
)
def create_collective(request, data: CollectiveSettings):
    _validate_collective_settings(data)
    user = request.auth
    with transaction.atomic():
        collective = Collective.objects.create(
            name=data.name.strip(),
            description=data.description,
            visibility=data.visibility,
            admission_type=data.admission_type,
            application_question=data.application_question,
        )
        Membership.objects.create(
            collective=collective,
            user=user,
            status=Membership.Status.ACTIVE,
            role=Membership.Role.ADMIN,
            joined_at=timezone.now(),
        )
    return collective_detail_for_viewer(collective, user)


@collectives_router.get(
    "/{collective_id}", response=CollectiveDetail, tags=["collectives"]
)
def get_collective(request, collective_id: int):
    collective = get_object_or_404(Collective, id=collective_id)
    user = get_optional_user(request)
    return collective_detail_for_viewer(collective, user)


@collectives_router.put(
    "/{collective_id}",
    response=CollectiveDetail,
    auth=JWTAuth(),
    tags=["collectives"],
)
def update_collective(request, collective_id: int, data: CollectiveSettings):
    _validate_collective_settings(data)

    user = request.auth
    membership = get_object_or_404(
        Membership.objects.select_related("user", "collective"),
        collective_id=collective_id,
        user_id=user.id,
    )
    if membership.role != Membership.Role.ADMIN:
        raise HttpError(403, "Only admins can update the collective.")

    collective = membership.collective
    collective.name = data.name.strip()
    collective.description = data.description
    collective.visibility = data.visibility
    collective.admission_type = data.admission_type
    collective.application_question = data.application_question
    collective.save()
    return collective_detail_for_viewer(collective, user)


@collectives_router.delete(
    "/{collective_id}",
    response=MessageOut,
    auth=JWTAuth(),
    tags=["collectives"],
)
def delete_collective(request, collective_id: int):
    user = request.auth
    membership = get_object_or_404(
        Membership.objects.select_related("user", "collective"),
        collective_id=collective_id,
        user_id=user.id,
    )
    if membership.role != Membership.Role.ADMIN:
        raise HttpError(403, "Only admins can delete the collective.")

    membership.collective.delete()
    return MessageOut(message="Collective deleted.")
