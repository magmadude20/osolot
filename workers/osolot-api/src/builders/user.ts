import {
  friendshipStatusSchema,
  userDetailSchema,
  userSummarySchema,
  type UserDetail,
  type UserSummary,
} from "@osolot/shared";
import type { Group, Profile } from "../../supabase-types/table-types";
import type { PostWithOwner } from "../lib/permissions/post";
import { toGroupSummary } from "./group";
import { toPostSummary } from "./post";

export function toUserSummary(
  profile: Pick<Profile, "username">,
  friendshipStatus?: string | null,
): UserSummary {
  const status =
    friendshipStatus != null
      ? friendshipStatusSchema.parse(friendshipStatus)
      : undefined;

  return userSummarySchema.parse({
    username: profile.username,
    friendshipStatus: status,
  });
}

export function buildUserDetail(input: {
  profile: Profile;
  friendshipStatus: string | null;
  mutualGroups: Group[];
  mutualFriends: Profile[];
  postsSharedWithMe: PostWithOwner[];
  viewerMembershipByGroupId: Map<string, { status: string; role: string }>;
}): UserDetail {
  return userDetailSchema.parse({
    summary: toUserSummary(
      input.profile,
      input.friendshipStatus,
    ),
    bio: input.profile.bio,
    friendshipStatus:
      input.friendshipStatus !== null
        ? friendshipStatusSchema.parse(input.friendshipStatus)
        : undefined,
    mutualGroups: input.mutualGroups.map((g) =>
      toGroupSummary(g, input.viewerMembershipByGroupId.get(g.id)),
    ),
    mutualFriends: input.mutualFriends.map((p) => toUserSummary(p)),
    postsSharedWithMe: input.postsSharedWithMe.map((p) => toPostSummary(p)),
  });
}
