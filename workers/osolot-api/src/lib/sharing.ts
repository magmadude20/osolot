import type { SupabaseClient } from "@supabase/supabase-js";
import { HTTPException } from "hono/http-exception";
import type { Database } from "../../supabase-types/generated-types";
import { throwOnDbError } from "./db-error";

export async function setPostSharedGroups(
  supabase: SupabaseClient<Database>,
  actorId: string,
  postId: string,
  groupIds: string[],
): Promise<void> {
  await supabase
    .from("post_shared_memberships")
    .delete()
    .eq("post_id", postId);

  if (groupIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(groupIds)];
  const { data, error } = await supabase
    .from("memberships")
    .select("id, group_id")
    .eq("user_id", actorId)
    .eq("status", "active")
    .in("group_id", uniqueIds);

  if (error) throwOnDbError(error);
  if (data.length !== uniqueIds.length) {
    throw new HTTPException(400, {
      message: "Not allowed to share with these groups.",
    });
  }

  const { error: insertError } = await supabase
    .from("post_shared_memberships")
    .insert(
      data.map((m) => ({
        post_id: postId,
        membership_id: m.id,
      })),
    );

  if (insertError) throwOnDbError(insertError);
}

export async function setPostSharedFriends(
  supabase: SupabaseClient<Database>,
  actorId: string,
  postId: string,
  usernames: string[],
): Promise<void> {
  await supabase
    .from("post_shared_friendships")
    .delete()
    .eq("post_id", postId);

  if (usernames.length === 0) return;

  const uniqueNames = [...new Set(usernames)];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, username")
    .in("username", uniqueNames);

  if (profileError) throwOnDbError(profileError);
  if (profiles.length !== uniqueNames.length) {
    throw new HTTPException(400, {
      message: "Not allowed to share with these friends.",
    });
  }

  const targetIds = profiles.map((p) => p.user_id);
  const { data: friendships, error: friendshipError } = await supabase
    .from("friendships")
    .select("id")
    .eq("source_id", actorId)
    .in("target_id", targetIds);

  if (friendshipError) throwOnDbError(friendshipError);
  if (friendships.length !== uniqueNames.length) {
    throw new HTTPException(400, {
      message: "Not allowed to share with these friends.",
    });
  }

  const { error: insertError } = await supabase
    .from("post_shared_friendships")
    .insert(
      friendships.map((f) => ({
        post_id: postId,
        friendship_id: f.id,
      })),
    );

  if (insertError) throwOnDbError(insertError);
}

export async function setMembershipSharedPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
  membershipId: string,
  postIds: string[],
): Promise<void> {
  await supabase
    .from("post_shared_memberships")
    .delete()
    .eq("membership_id", membershipId);

  if (postIds.length === 0) return;

  const uniqueIds = [...new Set(postIds)];
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("owner_id", userId)
    .in("id", uniqueIds);

  if (error) throwOnDbError(error);
  if (data.length !== uniqueIds.length) {
    throw new HTTPException(400, {
      message: "One or more posts are invalid or not owned by you.",
    });
  }

  const { error: insertError } = await supabase
    .from("post_shared_memberships")
    .insert(
      uniqueIds.map((postId) => ({
        post_id: postId,
        membership_id: membershipId,
      })),
    );

  if (insertError) throwOnDbError(insertError);
}

export async function loadPostSharingTargets(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<{
  groups: import("../../supabase-types/table-types").Group[];
  friends: { user_id: string; username: string; bio: string }[];
}> {
  const { data: membershipLinks, error: mError } = await supabase
    .from("post_shared_memberships")
    .select("membership_id, memberships (group_id, groups (*))")
    .eq("post_id", postId);

  if (mError) throwOnDbError(mError);

  const groups: import("../../supabase-types/table-types").Group[] = [];
  const seenGroups = new Set<string>();
  for (const row of membershipLinks) {
    const membership = (row as { memberships: { groups: import("../../supabase-types/table-types").Group } }).memberships;
    const group = membership.groups;
    if (!seenGroups.has(group.id)) {
      seenGroups.add(group.id);
      groups.push(group);
    }
  }

  const { data: friendshipLinks, error: fError } = await supabase
    .from("post_shared_friendships")
    .select(
      "friendship_id, friendships (target_id, profiles!friendships_target_id_fkey (user_id, username, bio))",
    )
    .eq("post_id", postId);

  if (fError) throwOnDbError(fError);

  const friends: { user_id: string; username: string; bio: string }[] = [];
  for (const row of friendshipLinks) {
    const friendship = (
      row as {
        friendships: {
          profiles: { user_id: string; username: string; bio: string };
        };
      }
    ).friendships;
    friends.push(friendship.profiles);
  }

  return { groups, friends };
}
