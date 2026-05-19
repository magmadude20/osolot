import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase-types/generated-types";
import type { Group, Membership } from "../../../supabase-types/table-types";
import { throwOnDbError } from "../db-error";
import {
  canManageMembers,
  findMembershipForUser,
  membershipCanManageMembers,
} from "./membership";

export type MembershipWithProfile = Membership & {
  profiles: { user_id: string; username: string; bio: string };
  groups: Group;
};

const membershipSelect = `
  *,
  profiles!memberships_user_id_fkey (user_id, username, bio),
  groups (*)
`;

/** Groups visible to the viewer: public, or any group they belong to. */
export async function fetchVisibleGroups(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
): Promise<Group[]> {
  if (viewerId === null) {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("visibility", "public");
    if (error) throwOnDbError(error);
    return data;
  }

  const { data: memberRows, error: memberError } = await supabase
    .from("memberships")
    .select("group_id")
    .eq("user_id", viewerId);

  if (memberError) throwOnDbError(memberError);

  const memberGroupIds = [...new Set(memberRows.map((m) => m.group_id))];

  if (memberGroupIds.length === 0) {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("visibility", "public");
    if (error) throwOnDbError(error);
    return data;
  }

  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .or(
      `visibility.eq.public,id.in.(${memberGroupIds.join(",")})`,
    );

  if (error) throwOnDbError(error);
  return data;
}

export async function fetchGroupById(
  supabase: SupabaseClient<Database>,
  groupId: string,
): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (error) throwOnDbError(error);
  return data;
}

export async function fetchAllGroupMemberships(
  supabase: SupabaseClient<Database>,
  groupId: string,
): Promise<MembershipWithProfile[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select(membershipSelect)
    .eq("group_id", groupId);

  if (error) throwOnDbError(error);
  return data;
}

/** Filter memberships visible to the viewer within a group. */
export async function filterVisibleGroupMembers(
  supabase: SupabaseClient<Database>,
  viewerId: string | null,
  groupId: string,
  allMembers: MembershipWithProfile[],
): Promise<MembershipWithProfile[]> {
  if (viewerId === null) {
    return [];
  }

  const viewerMembership = await findMembershipForUser(
    supabase,
    viewerId,
    groupId,
  );

  if (viewerMembership === null) {
    return [];
  }

  if (viewerMembership.status !== "active") {
    return allMembers.filter((m) => m.user_id === viewerId);
  }

  if (membershipCanManageMembers(viewerMembership)) {
    return allMembers;
  }

  return allMembers.filter((m) => m.status === "active");
}

export { canManageMembers, findMembershipForUser, membershipCanManageMembers };
