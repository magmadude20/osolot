import {
  membershipSummarySchema,
  updateProfileRequestSchema,
  userDetailSchema,
  userProfileSchema,
  userSummarySchema,
  type MembershipSummary,
  type UpdateProfileRequest,
  type UserDetail,
  type UserProfile,
  type UserSummary,
} from "@osolot/shared";
import { z } from "zod";
import { authFetch, messageSchema, optionalAuthFetch, parseJson } from "./client";

export class ProfileNotFoundError extends Error {
  constructor() {
    super("not_found");
    this.name = "ProfileNotFoundError";
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super("username_taken");
    this.name = "UsernameTakenError";
  }
}

export async function getMyProfile(accessToken: string): Promise<UserProfile> {
  const res = await authFetch(accessToken, "/users/me", { method: "GET" });
  if (res.status === 404) throw new ProfileNotFoundError();
  return parseJson(res, userProfileSchema);
}

export async function patchMyProfile(
  accessToken: string,
  body: UpdateProfileRequest,
): Promise<UserProfile> {
  const parsed = updateProfileRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const res = await authFetch(accessToken, "/users/me", {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });
  const json: unknown = await res.json().catch(() => null);
  if (res.status === 409) {
    throw new UsernameTakenError();
  }
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : res.statusText;
    if (
      res.status === 400 &&
      msg.toLowerCase().includes("username") &&
      msg.toLowerCase().includes("taken")
    ) {
      throw new UsernameTakenError();
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const out = userProfileSchema.safeParse(json);
  if (!out.success) throw new Error("Invalid response from profile API");
  return out.data;
}

export async function getUserDetail(
  accessToken: string | null,
  username: string,
): Promise<UserDetail> {
  const res = await optionalAuthFetch(
    accessToken,
    `/users/${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return parseJson(res, userDetailSchema);
}

export async function getMyMemberships(
  accessToken: string,
): Promise<MembershipSummary[]> {
  const res = await authFetch(accessToken, "/users/me/memberships", {
    method: "GET",
  });
  return parseJson(res, z.array(membershipSummarySchema));
}

export async function getMyFriends(accessToken: string): Promise<UserSummary[]> {
  const res = await authFetch(accessToken, "/users/me/friends", { method: "GET" });
  return parseJson(res, z.array(userSummarySchema));
}

export async function getMyFriendRequests(
  accessToken: string,
): Promise<UserSummary[]> {
  const res = await authFetch(accessToken, "/users/me/friend-requests", {
    method: "GET",
  });
  return parseJson(res, z.array(userSummarySchema));
}

export async function addFriendship(
  accessToken: string,
  username: string,
): Promise<string> {
  const res = await authFetch(
    accessToken,
    `/users/${encodeURIComponent(username)}/friendship`,
    { method: "POST" },
  );
  const data = await parseJson(res, messageSchema);
  return data.message;
}

export async function removeFriendship(
  accessToken: string,
  username: string,
): Promise<string> {
  const res = await authFetch(
    accessToken,
    `/users/${encodeURIComponent(username)}/friendship`,
    { method: "DELETE" },
  );
  const data = await parseJson(res, messageSchema);
  return data.message;
}
