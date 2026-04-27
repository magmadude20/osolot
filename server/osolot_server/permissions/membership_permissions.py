from django.db.models import QuerySet

from ..models import Membership, User


# Active memberships of users in mutual collectives with viewer.
def all_mutual_memberships_with_viewer(viewer: User | None) -> QuerySet[Membership]:
    if viewer is None:
        return Membership.objects.none()

    viewer_memberships = Membership.objects.for_user(viewer).filter(
        status=Membership.Status.ACTIVE
    )

    return Membership.objects.filter(
        collective__in=viewer_memberships.values_list("collective", flat=True),
        status=Membership.Status.ACTIVE,
    )
