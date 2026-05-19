import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase-types/generated-types";
import type { Group, Membership } from "../../supabase-types/table-types";
import { throwOnDbError } from "./db-error";
import {
  fetchAllGroupMemberships,
  filterVisibleGroupMembers,
  type MembershipWithProfile,
} from "./permissions/group";
import { fetchVisiblePosts, type PostWithOwner } from "./permissions/post";

/** Posts shared with active members visible to the viewer. */
export async function fetchGroupSharedPosts(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  groupId: string,
  visibleMembers: MembershipWithProfile[],
): Promise<PostWithOwner[]> {
  const activeMemberIds = visibleMembers
    .filter((m) => m.status === "active")
    .map((m) => m.id);

  if (activeMemberIds.length === 0) return [];

  const visiblePosts = await fetchVisiblePosts(supabase, viewerId);
  const visiblePostIds = new Set(visiblePosts.map((p) => p.id));

  const { data, error } = await supabase
    .from("post_shared_memberships")
    .select("post_id")
    .in("membership_id", activeMemberIds);

  if (error) throwOnDbError(error);

  const postIds = data
    .map((r) => r.post_id)
    .filter((id) => visiblePostIds.has(id));

  return visiblePosts.filter((p) => postIds.includes(p.id));
}

export async function loadMembershipSharedPosts(
  supabase: SupabaseClient<Database>,
  membershipId: string,
  viewerId: string | null,
): Promise<PostWithOwner[]> {
  const { data, error } = await supabase
    .from("post_shared_memberships")
    .select("post_id")
    .eq("membership_id", membershipId);

  if (error) throwOnDbError(error);

  const postIds = data.map((r) => r.post_id);
  if (postIds.length === 0) return [];

  const visible = await fetchVisiblePosts(supabase, viewerId);
  return visible.filter((p) => postIds.includes(p.id));
}

export async function getViewerMembershipMap(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  groups: Group[],
): Promise<Map<string, Membership>> {
  const map = new Map<string, Membership>();
  if (!viewerId) return map;

  for (const g of groups) {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", viewerId)
      .eq("group_id", g.id)
      .maybeSingle();
    if (error) throwOnDbError(error);
    if (data) map.set(g.id, data);
  }
  return map;
}

export async function buildGroupDetailContext(
  supabase: SupabaseClient<Database>,
  group: Group,
  viewerId: string | null,
) {
  const allMembers = await fetchAllGroupMemberships(supabase, group.id);
  const visibleMembers = await filterVisibleGroupMembers(
    supabase,
    viewerId,
    group.id,
    allMembers,
  );
  const sharedPosts = await fetchGroupSharedPosts(
    supabase,
    viewerId,
    group.id,
    visibleMembers,
  );
  const viewerMembership =
    viewerId !== null
      ? allMembers.find((m) => m.user_id === viewerId) ?? null
      : null;

  return { visibleMembers, sharedPosts, viewerMembership };
}
