from django.db.models import QuerySet

from ..permissions.membership_permissions import all_mutual_memberships_with_viewer

from ..models import Collective, User


# Collectives in common between viewer and user.
def mutual_collectives_with_user(
    viewer: User | None, user: User
) -> QuerySet[Collective]:
    return Collective.objects.filter(
        id__in=all_mutual_memberships_with_viewer(viewer)
        .filter(user=user)
        .values_list("collective", flat=True)
    )


# All users who share a collective with viewer. Both users must have an ACTIVE status in the collective.
def mutual_collective_users_for_viewer(viewer: User | None) -> QuerySet[User]:
    return User.objects.filter(
        id__in=all_mutual_memberships_with_viewer(viewer).values_list("user", flat=True)
    )
