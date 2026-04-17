from ..api.schemas import CollectiveSummary, MembershipSummary, UserSummary
from ..models import Collective, Membership, User


def user_summary(user: User) -> UserSummary:
    return UserSummary.from_orm(user)


def collective_summary(collective: Collective) -> CollectiveSummary:
    return CollectiveSummary.from_orm(collective)


def membership_summary(membership: Membership) -> MembershipSummary:
    return MembershipSummary(
        user=user_summary(membership.user),
        collective=collective_summary(membership.collective),
        status=membership.status,
        role=membership.role,
    )
