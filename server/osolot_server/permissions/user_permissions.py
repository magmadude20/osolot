from django.db.models import Q, QuerySet

from ..models import Collective, Membership, User


# Active memberships of users in mutual collectives with viewer.
def _all_mutual_memberships_with_viewer(viewer: User | None) -> QuerySet[Membership]:
    if viewer is None:
        return Membership.objects.none()

    viewer_memberships = Membership.objects.for_user(viewer).filter(
        status=Membership.Status.ACTIVE
    )

    return Membership.objects.filter(
        collective__in=viewer_memberships.values_list("collective", flat=True),
        status=Membership.Status.ACTIVE,
    )


# Collectives in common between viewer and user.
def mutual_collectives_with_user(
    viewer: User | None, user: User
) -> QuerySet[Collective]:
    return Collective.objects.filter(
        id__in=_all_mutual_memberships_with_viewer(viewer)
        .filter(user=user)
        .values_list("collective", flat=True)
    )


# All users who share a collective with viewer. Both users must have an ACTIVE status in the collective.
def mutual_collective_users_for_viewer(viewer: User | None) -> QuerySet[User]:
    return User.objects.filter(
        id__in=_all_mutual_memberships_with_viewer(viewer)
        .values_list("user", flat=True)
    )
