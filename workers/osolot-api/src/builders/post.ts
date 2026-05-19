import {
  postDetailSchema,
  postSharingDetailSchema,
  postSharingSummarySchema,
  postSummarySchema,
  postTypeSchema,
  type PostDetail,
  type PostSummary,
} from "@osolot/shared";
import type { Group, Profile } from "../../supabase-types/table-types";
import type { PostWithOwner } from "../lib/permissions/post";
import { toGroupSummary } from "./group";
import { toUserSummary } from "./user";

export function toPostSummary(
  post: PostWithOwner,
  includeSharing = false,
): PostSummary {
  const sharing = includeSharing
    ? postSharingSummarySchema.parse({
        public: post.public,
        shareWithNewGroupsDefault: post.share_with_new_groups_default,
        shareWithNewFriendsDefault: post.share_with_new_friends_default,
      })
    : undefined;

  return postSummarySchema.parse({
    id: post.id,
    type: postTypeSchema.parse(post.type),
    title: post.title,
    owner: toUserSummary(post.profiles),
    sharing,
  });
}

export function toMyPostSummary(post: PostWithOwner): PostSummary {
  return toPostSummary(post, true);
}

export function buildPostDetail(input: {
  post: PostWithOwner;
  viewerId: string | null;
  sharedGroups?: Group[];
  sharedFriends?: Pick<Profile, "username">[];
}): PostDetail {
  const isOwner =
    input.viewerId !== null && input.post.owner_id === input.viewerId;

  const sharing =
    isOwner && input.sharedGroups && input.sharedFriends
      ? postSharingDetailSchema.parse({
          public: input.post.public,
          shareWithNewGroupsDefault: input.post.share_with_new_groups_default,
          shareWithNewFriendsDefault: input.post.share_with_new_friends_default,
          sharedGroups: input.sharedGroups.map((g) => toGroupSummary(g)),
          sharedFriends: input.sharedFriends.map((p) => toUserSummary(p)),
        })
      : undefined;

  const createdAt = new Date(input.post.created_at).toISOString();
  const updatedAt = new Date(input.post.updated_at).toISOString();

  return postDetailSchema.parse({
    id: input.post.id,
    createdAt,
    updatedAt,
    type: postTypeSchema.parse(input.post.type),
    title: input.post.title,
    description: input.post.description,
    owner: toUserSummary(input.post.profiles),
    sharing,
  });
}
