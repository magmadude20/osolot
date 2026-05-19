import {
  createGroupBodySchema,
  groupIdParamSchema,
  groupSettingsSchema,
  joinGroupRequestSchema,
  updateMembershipRequestSchema,
  usernameParamSchema,
} from "@osolot/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  buildGroupDetail,
  toGroupSummary,
  viewerMembershipFromRow,
} from "../builders/group";
import { buildMembershipDetail, toMembershipSummary } from "../builders/membership";
import type { AppBindings, OptionalAppVariables } from "../env";
import { requireEmailVerified } from "../lib/auth-user";
import { throwOnDbError } from "../lib/db-error";
import { messageResponse } from "../lib/responses";
import { buildGroupDetailContext, loadMembershipSharedPosts } from "../lib/group-detail";
import {
  canManageMembers,
  fetchGroupById,
  fetchVisibleGroups,
  fetchAllGroupMemberships,
  filterVisibleGroupMembers,
  findMembershipForUser,
  membershipCanManageMembers,
} from "../lib/permissions/group";
import { canManageMemberRoles } from "../lib/permissions/membership";
import { setMembershipSharedPosts } from "../lib/sharing";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import type { Membership, Profile } from "../../supabase-types/table-types";

const groupIdUsernameParams = groupIdParamSchema.extend(
  usernameParamSchema.shape,
);

const groups = new Hono<{
  Bindings: AppBindings;
  Variables: OptionalAppVariables;
}>();

groups.use("*", optionalAuth);

groups.get("/", async (c) => {
  const supabase = c.get("supabase");
  const viewerId = c.get("userId");
  const visible = await fetchVisibleGroups(supabase, viewerId);

  const summaries = await Promise.all(
    visible.map(async (g) => {
      const membership =
        viewerId !== null
          ? await findMembershipForUser(supabase, viewerId, g.id)
          : null;
      return toGroupSummary(g, viewerMembershipFromRow(membership));
    }),
  );

  return c.json(summaries);
});

groups.post(
  "/",
  requireAuth,
  zValidator("json", createGroupBodySchema),
  async (c) => {
    const supabase = c.get("supabase");
    const userId = c.get("userId");
    await requireEmailVerified(supabase, userId);
    const data = c.req.valid("json");

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: data.name.trim(),
        description: data.description,
        visibility: data.visibility,
        admission_type: data.admissionType,
        application_question: data.applicationQuestion,
      })
      .select("*")
      .single();

    if (groupError) throwOnDbError(groupError);

    const now = new Date().toISOString();
    const { error: memberError } = await supabase.from("memberships").insert({
      group_id: group.id,
      user_id: userId,
      status: "active",
      role: "admin",
      joined_at: now,
    });

    if (memberError) throwOnDbError(memberError);

    const ctx = await buildGroupDetailContext(supabase, group, userId);
    return c.json(
      buildGroupDetail({
        group,
        members: ctx.visibleMembers,
        sharedPosts: ctx.sharedPosts,
        viewerMembership: viewerMembershipFromRow(ctx.viewerMembership),
      }),
      201,
    );
  },
);

groups.get(
  "/:groupId",
  zValidator("param", groupIdParamSchema),
  async (c) => {
    const { groupId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const viewerId = c.get("userId");

    const group = await fetchGroupById(supabase, groupId);
    if (!group) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const ctx = await buildGroupDetailContext(supabase, group, viewerId);
    return c.json(
      buildGroupDetail({
        group,
        members: ctx.visibleMembers,
        sharedPosts: ctx.sharedPosts,
        viewerMembership: viewerMembershipFromRow(ctx.viewerMembership),
      }),
    );
  },
);

groups.put(
  "/:groupId",
  requireAuth,
  zValidator("param", groupIdParamSchema),
  zValidator("json", groupSettingsSchema),
  async (c) => {
    const { groupId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const userId = c.get("userId");
    await requireEmailVerified(supabase, userId);
    const data = c.req.valid("json");

    const membership = await findMembershipForUser(supabase, userId, groupId);
    if (membership?.role !== "admin") {
      throw new HTTPException(403, {
        message: "Only admins can update the group.",
      });
    }

    const existing = await fetchGroupById(supabase, groupId);
    if (!existing) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const { data: group, error } = await supabase
      .from("groups")
      .update({
        name: (data.name ?? existing.name).trim(),
        description: data.description ?? existing.description,
        visibility: data.visibility ?? existing.visibility,
        admission_type: data.admissionType ?? existing.admission_type,
        application_question:
          data.applicationQuestion ?? existing.application_question,
      })
      .eq("id", groupId)
      .select("*")
      .single();

    if (error) throwOnDbError(error);

    const ctx = await buildGroupDetailContext(supabase, group, userId);
    return c.json(
      buildGroupDetail({
        group,
        members: ctx.visibleMembers,
        sharedPosts: ctx.sharedPosts,
        viewerMembership: viewerMembershipFromRow(ctx.viewerMembership),
      }),
    );
  },
);

groups.delete(
  "/:groupId",
  requireAuth,
  zValidator("param", groupIdParamSchema),
  async (c) => {
    const { groupId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const userId = c.get("userId");
    await requireEmailVerified(supabase, userId);

    const membership = await findMembershipForUser(supabase, userId, groupId);
    if (membership?.role !== "admin") {
      throw new HTTPException(403, {
        message: "Only admins can delete the group.",
      });
    }

    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    if (error) throwOnDbError(error);

    return c.json(messageResponse("Group deleted."));
  },
);

groups.get(
  "/:groupId/members",
  zValidator("param", groupIdParamSchema),
  async (c) => {
    const { groupId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const viewerId = c.get("userId");

    const group = await fetchGroupById(supabase, groupId);
    if (!group) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const allMembers = await fetchAllGroupMemberships(supabase, groupId);
    const visible = await filterVisibleGroupMembers(
      supabase,
      viewerId,
      groupId,
      allMembers,
    );

    return c.json(
      visible.map((m) => toMembershipSummary(m, m.profiles, m.groups)),
    );
  },
);

groups.post(
  "/:groupId/join",
  requireAuth,
  zValidator("param", groupIdParamSchema),
  zValidator("json", joinGroupRequestSchema),
  async (c) => {
    const { groupId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const userId = c.get("userId");
    const data = c.req.valid("json");

    const group = await fetchGroupById(supabase, groupId);
    if (!group) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const existing = await findMembershipForUser(supabase, userId, groupId);
    if (existing) {
      throw new HTTPException(400, {
        message: "Already a member or have a pending application.",
      });
    }

    const now = new Date().toISOString();
    const isOpen = group.admission_type === "open";

    const { data: membership, error } = await supabase
      .from("memberships")
      .insert({
        group_id: groupId,
        user_id: userId,
        status: isOpen ? "active" : "pending",
        role: "member",
        joined_at: isOpen ? now : null,
        application_message: data.applicationMessage,
      })
      .select("*")
      .single();

    if (error) throwOnDbError(error);

    await setMembershipSharedPosts(
      supabase,
      userId,
      membership.id,
      data.sharedPostIds,
    );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) throwOnDbError(profileError);

    const sharedPosts = await loadMembershipSharedPosts(
      supabase,
      membership.id,
      userId,
    );

    return c.json(
      buildMembershipDetail({
        membership,
        userProfile: profile,
        group,
        viewerMembership: membership,
        sharedPosts,
      }),
      201,
    );
  },
);

groups.get(
  "/:groupId/membership/:username",
  zValidator("param", groupIdUsernameParams),
  async (c) => {
    const { groupId, username } = c.req.valid("param");
    const supabase = c.get("supabase");
    const viewerId = c.get("userId");

    const group = await fetchGroupById(supabase, groupId);
    if (!group) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const allMembers = await fetchAllGroupMemberships(supabase, groupId);
    const visible = await filterVisibleGroupMembers(
      supabase,
      viewerId,
      groupId,
      allMembers,
    );

    const row = visible.find((m) => m.profiles.username === username);
    if (!row) {
      throw new HTTPException(404, { message: "Membership not found." });
    }

    const viewerMembership =
      viewerId !== null
        ? await findMembershipForUser(supabase, viewerId, groupId)
        : null;

    if (!viewerMembership) {
      throw new HTTPException(404, { message: "Membership not found." });
    }

    const sharedPosts = await loadMembershipSharedPosts(
      supabase,
      row.id,
      viewerId,
    );

    let approvedByProfile: Profile | null = null;
    if (row.approved_by) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", row.approved_by)
        .maybeSingle();
      approvedByProfile = data;
    }

    return c.json(
      buildMembershipDetail({
        membership: row,
        userProfile: row.profiles as Profile,
        group,
        viewerMembership,
        sharedPosts,
        approvedByProfile,
      }),
    );
  },
);

groups.put(
  "/:groupId/membership/:username",
  requireAuth,
  zValidator("param", groupIdUsernameParams),
  zValidator("json", updateMembershipRequestSchema),
  async (c) => {
    const { groupId, username } = c.req.valid("param");
    const supabase = c.get("supabase");
    const actorId = c.get("userId");
    const data = c.req.valid("json");

    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (profileError) throwOnDbError(profileError);
    if (!targetProfile) {
      throw new HTTPException(404, { message: "Membership not found." });
    }

    const { data: userMembership, error: mError } = await supabase
      .from("memberships")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", targetProfile.user_id)
      .maybeSingle();

    if (mError) throwOnDbError(mError);
    if (!userMembership) {
      throw new HTTPException(404, { message: "Membership not found." });
    }

    const group = await fetchGroupById(supabase, groupId);
    if (!group) {
      throw new HTTPException(404, { message: "not_found" });
    }

    const actorMembership =
      actorId === targetProfile.user_id
        ? userMembership
        : await findMembershipForUser(supabase, actorId, groupId);

    if (!actorMembership) {
      throw new HTTPException(403, { message: "Not allowed." });
    }

    const updates: Partial<Membership> = {};

    if (data.applicationMessage !== undefined) {
      if (actorId !== targetProfile.user_id) {
        throw new HTTPException(403, { message: "Not allowed." });
      }
      if (userMembership.status !== "pending") {
        throw new HTTPException(400, {
          message: "Only pending members can update their application message.",
        });
      }
      updates.application_message = data.applicationMessage ?? "";
    }

    if (data.sharedPostIds !== undefined) {
      if (actorId !== targetProfile.user_id) {
        throw new HTTPException(403, { message: "Not allowed." });
      }
      await setMembershipSharedPosts(
        supabase,
        targetProfile.user_id,
        userMembership.id,
        data.sharedPostIds ?? [],
      );
    }

    if (data.status !== undefined && data.status !== null) {
      if (!membershipCanManageMembers(actorMembership)) {
        throw new HTTPException(403, { message: "Not allowed." });
      }
      if (
        userMembership.status === "pending" &&
        data.status === "active"
      ) {
        updates.status = "active";
        updates.joined_at = new Date().toISOString();
        updates.approved_by = actorId;
      }
    }

    if (data.role !== undefined && data.role !== null) {
      if (!canManageMemberRoles(actorMembership)) {
        throw new HTTPException(403, { message: "Only admins can change roles." });
      }

      const { count } = await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("role", "admin");

      if (count === 1 && userMembership.role === "admin") {
        throw new HTTPException(400, {
          message: "Cannot demote the last admin.",
        });
      }
      updates.role = data.role;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("memberships")
        .update(updates)
        .eq("id", userMembership.id);
      if (error) throwOnDbError(error);
    }

    const { count: adminCount, error: adminError } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "active")
      .eq("role", "admin");

    if (adminError) throwOnDbError(adminError);
    if ((adminCount ?? 0) === 0) {
      throw new HTTPException(400, {
        message: "Group must have at least one active admin.",
      });
    }

    const { data: updated, error: fetchUpdatedError } = await supabase
      .from("memberships")
      .select("*")
      .eq("id", userMembership.id)
      .single();

    if (fetchUpdatedError) throwOnDbError(fetchUpdatedError);

    const sharedPosts = await loadMembershipSharedPosts(
      supabase,
      updated.id,
      actorId,
    );

    let approvedByProfile: Profile | null = null;
    if (updated.approved_by) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", updated.approved_by)
        .maybeSingle();
      approvedByProfile = data;
    }

    return c.json(
      buildMembershipDetail({
        membership: updated,
        userProfile: targetProfile,
        group,
        viewerMembership: actorMembership,
        sharedPosts,
        approvedByProfile,
      }),
    );
  },
);

groups.delete(
  "/:groupId/membership/:username",
  requireAuth,
  zValidator("param", groupIdUsernameParams),
  async (c) => {
    const { groupId, username } = c.req.valid("param");
    const supabase = c.get("supabase");
    const actorId = c.get("userId");

    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", actorId)
      .single();

    const actorMembership = await findMembershipForUser(
      supabase,
      actorId,
      groupId,
    );
    if (!actorMembership) {
      throw new HTTPException(403, { message: "Not allowed." });
    }

    if (
      actorProfile?.username !== username &&
      !canManageMembers(actorMembership.status, actorMembership.role)
    ) {
      throw new HTTPException(403, { message: "Not allowed." });
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (!targetProfile) {
      throw new HTTPException(404, { message: "Membership not found." });
    }

    const { data: userMembership } = await supabase
      .from("memberships")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", targetProfile.user_id)
      .maybeSingle();

    if (!userMembership) {
      throw new HTTPException(404, { message: "Membership not found." });
    }

    if (userMembership.role === "admin") {
      const { count } = await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        throw new HTTPException(400, {
          message: "Cannot remove the last admin.",
        });
      }
    }

    const { error } = await supabase
      .from("memberships")
      .delete()
      .eq("id", userMembership.id);
    if (error) throwOnDbError(error);

    const { count: adminCount, error: adminError } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "active")
      .eq("role", "admin");

    if (adminError) throwOnDbError(adminError);
    if ((adminCount ?? 0) === 0) {
      throw new HTTPException(400, {
        message: "Group must have at least one active admin.",
      });
    }

    return c.json(messageResponse("Member removed."));
  },
);

export { groups };
