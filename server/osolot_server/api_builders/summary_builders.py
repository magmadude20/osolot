from ..api.schemas import CollectiveSummary, MembershipSummary, UserSummary
from ..models import Collective, Membership, User


def user_summary(user: User) -> UserSummary:
    return UserSummary(
        id=user.id,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
    )


def collective_summary(collective: Collective) -> CollectiveSummary:
    return CollectiveSummary(
        id=collective.id,
        name=collective.name,
        description=collective.description,
        visibility=collective.visibility,
        admission_type=collective.admission_type,
    )


def membership_summary(membership: Membership) -> MembershipSummary:
    return MembershipSummary(
        user=user_summary(membership.user),
        collective=collective_summary(membership.collective),
        status=membership.status,
        role=membership.role,
    )
