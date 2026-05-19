import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase-types/generated-types";
import type { Membership } from "../../../supabase-types/table-types";
import { throwOnDbError } from "../db-error";

/** Active memberships in groups where `viewerId` has an active membership. */
export async function getViewerActiveGroupIds(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("group_id")
    .eq("user_id", viewerId)
    .eq("status", "active");

  if (error) throwOnDbError(error);
  return [...new Set(data.map((m) => m.group_id))];
}

/** Active membership IDs in groups shared with the viewer. */
export async function allMutualMembershipIdsWithViewer(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
): Promise<string[]> {
  if (viewerId === null) return [];

  const groupIds = await getViewerActiveGroupIds(supabase, viewerId);
  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .in("group_id", groupIds)
    .eq("status", "active");

  if (error) throwOnDbError(error);
  return data.map((m) => m.id);
}

export async function findMembershipForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  groupId: string,
): Promise<Membership | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (error) throwOnDbError(error);
  return data;
}

export function membershipCanManageMembers(membership: Membership): boolean {
  return (
    membership.status === "active" &&
    (membership.role === "admin" || membership.role === "moderator")
  );
}

export function canManageMemberRoles(membership: Membership): boolean {
  return membership.status === "active" && membership.role === "admin";
}

export function canManageMembers(
  status: string,
  role: string,
): boolean {
  return status === "active" && (role === "admin" || role === "moderator");
}
