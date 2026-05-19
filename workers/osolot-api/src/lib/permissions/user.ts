import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase-types/generated-types";
import type { Group, Profile } from "../../../supabase-types/table-types";
import { throwOnDbError } from "../db-error";
import {
  allMutualMembershipIdsWithViewer,
  getViewerActiveGroupIds,
} from "./membership";
import { fetchVisiblePosts, type PostWithOwner } from "./post";

export async function getFriendshipStatus(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  targetUserId: string,
): Promise<string | null> {
  if (viewerId === null) return null;

  const { data, error } = await supabase
    .from("friendships")
    .select("status")
    .eq("source_id", viewerId)
    .eq("target_id", targetUserId)
    .maybeSingle();

  if (error) throwOnDbError(error);
  return data?.status ?? null;
}

/** Groups where both viewer and user have active memberships in the same group. */
export async function fetchMutualGroupsWithUser(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  userId: string,
): Promise<Group[]> {
  if (viewerId === null) return [];

  const viewerGroupIds = await getViewerActiveGroupIds(supabase, viewerId);
  if (viewerGroupIds.length === 0) return [];

  const { data, error } = await supabase
    .from("memberships")
    .select("group_id, groups (*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("group_id", viewerGroupIds);

  if (error) throwOnDbError(error);

  const groups: Group[] = [];
  const seen = new Set<string>();
  for (const row of data) {
    const group = (row as { groups: Group }).groups;
    if (!seen.has(group.id)) {
      seen.add(group.id);
      groups.push(group);
    }
  }
  return groups;
}

/** Users who are mutual friends between viewer and user. */
export async function fetchMutualFriendsWithUser(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  userId: string,
): Promise<Profile[]> {
  if (viewerId === null) return [];

  const viewerFriendIds = await activeFriendSourceIds(supabase, viewerId);
  const userFriendIds = await activeFriendSourceIds(supabase, userId);
  const mutualIds = viewerFriendIds.filter((id) => userFriendIds.includes(id));

  if (mutualIds.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", mutualIds);

  if (error) throwOnDbError(error);
  return data;
}

async function activeFriendSourceIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("friendships")
    .select("source_id")
    .eq("target_id", userId)
    .eq("status", "active");

  if (error) throwOnDbError(error);
  return data.map((f) => f.source_id);
}

export async function fetchPostsSharedWithViewerFromOwner(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  ownerId: string,
): Promise<PostWithOwner[]> {
  const visible = await fetchVisiblePosts(supabase, viewerId);
  return visible.filter((p) => p.owner_id === ownerId);
}

export async function fetchProfileByUsername(
  supabase: SupabaseClient<Database>,
  username: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throwOnDbError(error);
  return data;
}

export { allMutualMembershipIdsWithViewer };
