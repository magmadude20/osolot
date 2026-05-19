import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase-types/generated-types";
import type { Post } from "../../../supabase-types/table-types";
import { throwOnDbError } from "../db-error";
import { allMutualMembershipIdsWithViewer } from "./membership";

export type PostWithOwner = Post & {
  profiles: { user_id: string; username: string; bio: string };
};

const postSelect = `
  *,
  profiles!posts_owner_id_fkey (user_id, username, bio)
`;

async function sharedPostIdsForViewer(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<string[]> {
  const membershipIds = await allMutualMembershipIdsWithViewer(
    supabase,
    viewerId,
  );

  const postIds = new Set<string>();

  if (membershipIds.length > 0) {
    const { data, error } = await supabase
      .from("post_shared_memberships")
      .select("post_id")
      .in("membership_id", membershipIds);
    if (error) throwOnDbError(error);
    for (const row of data) {
      postIds.add(row.post_id);
    }
  }

  const { data: friendships, error: friendshipError } = await supabase
    .from("friendships")
    .select("id")
    .eq("target_id", viewerId)
    .eq("status", "active");

  if (friendshipError) throwOnDbError(friendshipError);

  const friendshipIds = friendships.map((f) => f.id);
  if (friendshipIds.length > 0) {
    const { data, error } = await supabase
      .from("post_shared_friendships")
      .select("post_id")
      .in("friendship_id", friendshipIds);
    if (error) throwOnDbError(error);
    for (const row of data) {
      postIds.add(row.post_id);
    }
  }

  return [...postIds];
}

/** Posts visible to the viewer. */
export async function fetchVisiblePosts(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
): Promise<PostWithOwner[]> {
  if (viewerId === null) {
    const { data, error } = await supabase
      .from("posts")
      .select(postSelect)
      .eq("public", true)
      .order("created_at", { ascending: false });
    if (error) throwOnDbError(error);
    return data;
  }

  const sharedIds = await sharedPostIdsForViewer(supabase, viewerId);
  const orParts = [`owner_id.eq.${viewerId}`, "public.eq.true"];
  if (sharedIds.length > 0) {
    orParts.push(`id.in.(${sharedIds.join(",")})`);
  }

  const { data, error } = await supabase
    .from("posts")
    .select(postSelect)
    .or(orParts.join(","))
    .order("created_at", { ascending: false });

  if (error) throwOnDbError(error);
  return data;
}

export async function fetchVisiblePostById(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  postId: string,
): Promise<PostWithOwner | null> {
  const posts = await fetchVisiblePosts(supabase, viewerId);
  return posts.find((p) => p.id === postId) ?? null;
}

export async function fetchOwnedPosts(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<PostWithOwner[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(postSelect)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throwOnDbError(error);
  return data;
}
