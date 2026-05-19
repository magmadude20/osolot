import {
  membershipDetailSchema,
  membershipRoleSchema,
  membershipStatusSchema,
  membershipSummarySchema,
  type MembershipDetail,
  type MembershipSummary,
} from "@osolot/shared";
import type { Group, Membership, Profile } from "../../supabase-types/table-types";
import { membershipCanManageMembers } from "../lib/permissions/membership";
import type { PostWithOwner } from "../lib/permissions/post";
import { toGroupSummary } from "./group";
import { toPostSummary } from "./post";
import { toUserSummary } from "./user";

export function toMembershipSummary(
  membership: Membership,
  userProfile: Pick<Profile, "username">,
  group: Group,
  viewerMembershipOnGroup?: { status: string; role: string } | null,
): MembershipSummary {
  return membershipSummarySchema.parse({
    user: toUserSummary(userProfile),
    group: toGroupSummary(group, viewerMembershipOnGroup),
    status: membershipStatusSchema.parse(membership.status),
    role: membershipRoleSchema.parse(membership.role),
  });
}

export function buildMembershipDetail(input: {
  membership: Membership;
  userProfile: Profile;
  group: Group;
  viewerMembership: Membership;
  sharedPosts: PostWithOwner[];
  approvedByProfile?: Profile | null;
}): MembershipDetail {
  const summary = toMembershipSummary(
    input.membership,
    input.userProfile,
    input.group,
    {
      status: input.viewerMembership.status,
      role: input.viewerMembership.role,
    },
  );

  const isOwn = input.viewerMembership.user_id === input.membership.user_id;
  const canSeeAll =
    isOwn || membershipCanManageMembers(input.viewerMembership);

  const base: MembershipDetail = {
    summary,
    sharedPosts: input.sharedPosts.map((p) => toPostSummary(p)),
  };

  if (!canSeeAll) {
    return membershipDetailSchema.parse({
      ...base,
      joinedAt: input.membership.joined_at ?? undefined,
    });
  }

  const updatedAt = new Date(input.membership.updated_at).toISOString();
  const appliedAt = new Date(input.membership.applied_at).toISOString();
  // User may not have joined yet
  const joinedAt = input.membership.joined_at ? new Date(input.membership.joined_at).toISOString() : undefined;

  return membershipDetailSchema.parse({
    ...base,
    applicationMessage: input.membership.application_message,
    appliedAt: appliedAt,
    joinedAt: joinedAt,
    updatedAt: updatedAt,
    approvedBy: input.approvedByProfile
      ? toUserSummary(input.approvedByProfile)
      : null,
  });
}
