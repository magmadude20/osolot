import {
  updateProfileRequestSchema,
  usernameParamSchema,
} from "@osolot/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { toMembershipSummary } from "../builders/membership";
import { toUserProfile } from "../builders/profile";
import { buildUserDetail, toUserSummary } from "../builders/user";
import type { AppBindings, AppVariables, OptionalAppVariables } from "../env";
import { getAuthUser } from "../lib/auth-user";
import { isUniqueViolation, throwOnDbError } from "../lib/db-error";
import { messageResponse } from "../lib/responses";
import { findMembershipForUser } from "../lib/permissions/membership";
import {
  fetchMutualFriendsWithUser,
  fetchMutualGroupsWithUser,
  fetchPostsSharedWithViewerFromOwner,
  fetchProfileByUsername,
  getFriendshipStatus,
} from "../lib/permissions/user";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import type { Group, Membership } from "../../supabase-types/table-types";

const membershipListSelect = `
  *,
  profiles!memberships_user_id_fkey (user_id, username, bio),
  groups (*)
`;

const users = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

users.get("/me", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throwOnDbError(error);
  if (!data) {
    throw new HTTPException(404, { message: "not_found" });
  }

  const auth = await getAuthUser(supabase, userId);
  return c.json(toUserProfile(data, auth));
});

users.patch(
  "/me",
  requireAuth,
  zValidator("json", updateProfileRequestSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const { data: existing, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) throwOnDbError(fetchError);

    const updates: Record<string, string> = {};
    if (body.username !== undefined) {
      updates.username = body.username.trim();
    }
    if (body.bio !== undefined) {
      updates.bio = body.bio.trim();
    }

    let row = existing;
    if (Object.keys(updates).length > 0) {
      const username =
        body.username !== undefined
          ? body.username.trim()
          : existing?.username;
      const bio =
        body.bio !== undefined ? body.bio.trim() : existing?.bio;
      if (username === undefined || bio === undefined) {
        throw new HTTPException(404, { message: "not_found" });
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            username,
            bio,
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();

      if (error) {
        if (isUniqueViolation(error)) {
          throw new HTTPException(400, {
            message: "That username is already taken.",
          });
        }
        throwOnDbError(error);
      }
      row = data;
    }

    if (!row) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const auth = await getAuthUser(supabase, userId);
    return c.json(toUserProfile(row, auth));
  },
);

users.get("/me/memberships", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  const { data, error } = await supabase
    .from("memberships")
    .select(membershipListSelect)
    .eq("user_id", userId);

  if (error) throwOnDbError(error);

  const summaries = data.map((m) => {
    const row = m as Membership & {
      profiles: { username: string };
      groups: Group;
    };
    return toMembershipSummary(row, row.profiles, row.groups);
  });

  return c.json(summaries);
});

users.get("/me/friends", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  const { data, error } = await supabase
    .from("friendships")
    .select("profiles!friendships_target_id_fkey (username)")
    .eq("source_id", userId)
    .eq("status", "active");

  if (error) throwOnDbError(error);

  return c.json(
    data.map((f) => toUserSummary(f.profiles, "active")),
  );
});

users.get("/me/friend-requests", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  const { data, error } = await supabase
    .from("friendships")
    .select("profiles!friendships_target_id_fkey (username)")
    .eq("source_id", userId)
    .eq("status", "pending_received");

  if (error) throwOnDbError(error);

  return c.json(data.map((f) => toUserSummary(f.profiles)));
});

users.post(
  "/:username/friendship",
  requireAuth,
  zValidator("param", usernameParamSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const sourceId = c.get("userId");
    const { username } = c.req.valid("param");

    const target = await fetchProfileByUsername(supabase, username);
    if (!target) {
      throw new HTTPException(404, { message: "not_found" });
    }

    if (sourceId === target.user_id) {
      throw new HTTPException(400, {
        message: "You cannot add yourself as a friend.",
      });
    }

    const { data: sourceToTarget, error } = await supabase
      .from("friendships")
      .select("*")
      .eq("source_id", sourceId)
      .eq("target_id", target.user_id)
      .maybeSingle();

    if (error) throwOnDbError(error);

    if (!sourceToTarget) {
      const { error: insertError } = await supabase.from("friendships").insert([
        {
          source_id: sourceId,
          target_id: target.user_id,
          status: "pending_sent",
        },
        {
          source_id: target.user_id,
          target_id: sourceId,
          status: "pending_received",
        },
      ]);
      if (insertError) throwOnDbError(insertError);
      return c.json(messageResponse("Friend request sent."));
    }

    if (sourceToTarget.status === "active") {
      throw new HTTPException(400, {
        message: "You're already friends!",
      });
    }
    if (sourceToTarget.status === "pending_sent") {
      throw new HTTPException(400, {
        message: "You've already sent a friend request to this user.",
      });
    }

    const { data: targetToSource, error: reverseError } = await supabase
      .from("friendships")
      .select("*")
      .eq("source_id", target.user_id)
      .eq("target_id", sourceId)
      .maybeSingle();

    if (reverseError) throwOnDbError(reverseError);
    if (
      targetToSource?.status !== "pending_sent" ||
      sourceToTarget.status !== "pending_received"
    ) {
      throw new HTTPException(500, { message: "server_error" });
    }

    const { error: update1 } = await supabase
      .from("friendships")
      .update({ status: "active" })
      .eq("source_id", sourceId)
      .eq("target_id", target.user_id);
    if (update1) throwOnDbError(update1);

    const { error: update2 } = await supabase
      .from("friendships")
      .update({ status: "active" })
      .eq("source_id", target.user_id)
      .eq("target_id", sourceId);
    if (update2) throwOnDbError(update2);

    return c.json(messageResponse("Friend request accepted."));
  },
);

users.delete(
  "/:username/friendship",
  requireAuth,
  zValidator("param", usernameParamSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const sourceId = c.get("userId");
    const { username } = c.req.valid("param");

    const target = await fetchProfileByUsername(supabase, username);
    if (!target) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const { count: sourceDeleted, error: e1 } = await supabase
      .from("friendships")
      .delete({ count: "exact" })
      .eq("source_id", sourceId)
      .eq("target_id", target.user_id);

    if (e1) throwOnDbError(e1);

    const { count: targetDeleted, error: e2 } = await supabase
      .from("friendships")
      .delete({ count: "exact" })
      .eq("source_id", target.user_id)
      .eq("target_id", sourceId);

    if (e2) throwOnDbError(e2);

    if ((sourceDeleted ?? 0) === 0 && (targetDeleted ?? 0) === 0) {
      return c.json(messageResponse("Friend not found."));
    }

    return c.json(messageResponse("Friend removed."));
  },
);

const usersOptional = new Hono<{
  Bindings: AppBindings;
  Variables: OptionalAppVariables;
}>();

usersOptional.get(
  "/:username",
  optionalAuth,
  zValidator("param", usernameParamSchema),
  async (c) => {
    const { username } = c.req.valid("param");
    const supabase = c.get("supabase");
    const viewerId = c.get("userId");

    const profile = await fetchProfileByUsername(supabase, username);
    if (!profile) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const friendshipStatus = await getFriendshipStatus(
      supabase,
      viewerId,
      profile.user_id,
    );
    const mutualGroups = await fetchMutualGroupsWithUser(
      supabase,
      viewerId,
      profile.user_id,
    );
    const mutualFriends = await fetchMutualFriendsWithUser(
      supabase,
      viewerId,
      profile.user_id,
    );
    const postsSharedWithMe = await fetchPostsSharedWithViewerFromOwner(
      supabase,
      viewerId,
      profile.user_id,
    );

    const viewerMembershipByGroupId = new Map<
      string,
      { status: string; role: string }
    >();
    if (viewerId) {
      for (const g of mutualGroups) {
        const m = await findMembershipForUser(supabase, viewerId, g.id);
        if (m) {
          viewerMembershipByGroupId.set(g.id, {
            status: m.status,
            role: m.role,
          });
        }
      }
    }

    return c.json(
      buildUserDetail({
        profile,
        friendshipStatus,
        mutualGroups,
        mutualFriends,
        postsSharedWithMe,
        viewerMembershipByGroupId,
      }),
    );
  },
);

users.route("/", usersOptional);

export { users };
