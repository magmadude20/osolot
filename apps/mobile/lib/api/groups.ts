import {
  createGroupBodySchema,
  groupDetailSchema,
  groupSettingsSchema,
  groupSummarySchema,
  joinGroupRequestSchema,
  membershipDetailSchema,
  membershipSummarySchema,
  updateMembershipRequestSchema,
  type CreateGroupBody,
  type GroupDetail,
  type GroupSettings,
  type GroupSummary,
  type JoinGroupRequest,
  type MembershipDetail,
  type MembershipSummary,
  type UpdateMembershipRequest,
} from "@osolot/shared";
import { z } from "zod";
import { authFetch, messageSchema, optionalAuthFetch, parseJson } from "./client";

export async function listGroups(
  accessToken: string | null,
): Promise<GroupSummary[]> {
  const res = await optionalAuthFetch(accessToken, "/groups/", { method: "GET" });
  return parseJson(res, z.array(groupSummarySchema));
}

export async function getGroup(
  accessToken: string | null,
  groupId: string,
): Promise<GroupDetail> {
  const res = await optionalAuthFetch(accessToken, `/groups/${groupId}`, {
    method: "GET",
  });
  return parseJson(res, groupDetailSchema);
}

export async function createGroup(
  accessToken: string,
  body: CreateGroupBody,
): Promise<GroupDetail> {
  const parsed = createGroupBodySchema.parse(body);
  const res = await authFetch(accessToken, "/groups/", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return parseJson(res, groupDetailSchema);
}

export async function updateGroup(
  accessToken: string,
  groupId: string,
  body: GroupSettings,
): Promise<GroupDetail> {
  const parsed = groupSettingsSchema.parse(body);
  const res = await authFetch(accessToken, `/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify(parsed),
  });
  return parseJson(res, groupDetailSchema);
}

export async function deleteGroup(
  accessToken: string,
  groupId: string,
): Promise<string> {
  const res = await authFetch(accessToken, `/groups/${groupId}`, {
    method: "DELETE",
  });
  const data = await parseJson(res, messageSchema);
  return data.message;
}

export async function listGroupMembers(
  accessToken: string | null,
  groupId: string,
): Promise<MembershipSummary[]> {
  const res = await optionalAuthFetch(accessToken, `/groups/${groupId}/members`, {
    method: "GET",
  });
  return parseJson(res, z.array(membershipSummarySchema));
}

export async function joinGroup(
  accessToken: string,
  groupId: string,
  body: JoinGroupRequest,
): Promise<MembershipDetail> {
  const parsed = joinGroupRequestSchema.parse(body);
  const res = await authFetch(accessToken, `/groups/${groupId}/join`, {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return parseJson(res, membershipDetailSchema);
}

export async function getMembership(
  accessToken: string | null,
  groupId: string,
  username: string,
): Promise<MembershipDetail> {
  const res = await optionalAuthFetch(
    accessToken,
    `/groups/${groupId}/membership/${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return parseJson(res, membershipDetailSchema);
}

export async function updateMembership(
  accessToken: string,
  groupId: string,
  username: string,
  body: UpdateMembershipRequest,
): Promise<MembershipDetail> {
  const parsed = updateMembershipRequestSchema.parse(body);
  const res = await authFetch(
    accessToken,
    `/groups/${groupId}/membership/${encodeURIComponent(username)}`,
    { method: "PUT", body: JSON.stringify(parsed) },
  );
  return parseJson(res, membershipDetailSchema);
}

export async function deleteMembership(
  accessToken: string,
  groupId: string,
  username: string,
): Promise<string> {
  const res = await authFetch(
    accessToken,
    `/groups/${groupId}/membership/${encodeURIComponent(username)}`,
    { method: "DELETE" },
  );
  const data = await parseJson(res, messageSchema);
  return data.message;
}
