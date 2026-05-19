import {
  createPostBodySchema,
  postIdParamSchema,
  postSettingsSchema,
} from "@osolot/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  buildPostDetail,
  toMyPostSummary,
  toPostSummary,
} from "../builders/post";
import type { AppBindings, OptionalAppVariables } from "../env";
import type { PostUpdate } from "../../supabase-types/table-types";
import { requireEmailVerified } from "../lib/auth-user";
import { throwOnDbError } from "../lib/db-error";
import { messageResponse } from "../lib/responses";
import {
  fetchOwnedPosts,
  fetchVisiblePostById,
  fetchVisiblePosts,
} from "../lib/permissions/post";
import {
  loadPostSharingTargets,
  setPostSharedFriends,
  setPostSharedGroups,
} from "../lib/sharing";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";

const posts = new Hono<{
  Bindings: AppBindings;
  Variables: OptionalAppVariables;
}>();

posts.use("*", optionalAuth);

posts.get("/mine", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");
  const owned = await fetchOwnedPosts(supabase, userId);
  return c.json(owned.map((p) => toMyPostSummary(p)));
});

posts.get("/", async (c) => {
  const supabase = c.get("supabase");
  const viewerId = c.get("userId");
  const visible = await fetchVisiblePosts(supabase, viewerId);
  return c.json(visible.map((p) => toPostSummary(p)));
});

posts.get(
  "/:postId",
  zValidator("param", postIdParamSchema),
  async (c) => {
    const { postId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const viewerId = c.get("userId");

    const post = await fetchVisiblePostById(supabase, viewerId, postId);
    if (!post) {
      throw new HTTPException(404, { message: "Post not found." });
    }

    let sharedGroups;
    let sharedFriends;
    if (viewerId === post.owner_id) {
      const targets = await loadPostSharingTargets(supabase, postId);
      sharedGroups = targets.groups;
      sharedFriends = targets.friends;
    }

    return c.json(
      buildPostDetail({
        post,
        viewerId,
        sharedGroups,
        sharedFriends,
      }),
    );
  },
);

posts.post("/", requireAuth, zValidator("json", createPostBodySchema), async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");
  await requireEmailVerified(supabase, userId);
  const data = c.req.valid("json");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      owner_id: userId,
      type: data.type,
      title: data.title.trim(),
      description: data.description,
      public: data.public,
      share_with_new_groups_default: data.shareWithNewGroupsDefault,
      share_with_new_friends_default: data.shareWithNewFriendsDefault,
    })
    .select(
      "*, profiles!posts_owner_id_fkey (user_id, username, bio)",
    )
    .single();

  if (error) throwOnDbError(error);

  await setPostSharedGroups(supabase, userId, post.id, data.sharedGroupIds);
  await setPostSharedFriends(
    supabase,
    userId,
    post.id,
    data.sharedFriendUsernames,
  );

  const targets = await loadPostSharingTargets(supabase, post.id);
  const postWithOwner = {
    ...post,
    profiles: (post as { profiles: { user_id: string; username: string; bio: string } })
      .profiles,
  };

  return c.json(
    buildPostDetail({
      post: postWithOwner,
      viewerId: userId,
      sharedGroups: targets.groups,
      sharedFriends: targets.friends,
    }),
    201,
  );
});

posts.patch(
  "/:postId",
  requireAuth,
  zValidator("param", postIdParamSchema),
  zValidator("json", postSettingsSchema),
  async (c) => {
    const { postId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const userId = c.get("userId");
    await requireEmailVerified(supabase, userId);
    const data = c.req.valid("json");

    const post = await fetchVisiblePostById(supabase, userId, postId);
    if (!post) {
      throw new HTTPException(404, { message: "Post not found." });
    }
    if (post.owner_id !== userId) {
      throw new HTTPException(403, { message: "Not allowed." });
    }

    const updates: PostUpdate = {};
    if (data.title !== undefined) updates.title = data.title.trim();
    if (data.type !== undefined) updates.type = data.type;
    if (data.description !== undefined) updates.description = data.description;
    if (data.public !== undefined) updates.public = data.public;
    if (data.shareWithNewGroupsDefault !== undefined) {
      updates.share_with_new_groups_default = data.shareWithNewGroupsDefault;
    }
    if (data.shareWithNewFriendsDefault !== undefined) {
      updates.share_with_new_friends_default = data.shareWithNewFriendsDefault;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", postId);
      if (error) throwOnDbError(error);
    }

    if (data.sharedGroupIds !== undefined) {
      await setPostSharedGroups(
        supabase,
        userId,
        postId,
        data.sharedGroupIds ?? [],
      );
    }
    if (data.sharedFriendUsernames !== undefined) {
      await setPostSharedFriends(
        supabase,
        userId,
        postId,
        data.sharedFriendUsernames ?? [],
      );
    }

    const updated = await fetchVisiblePostById(supabase, userId, postId);
    if (!updated) {
      throw new HTTPException(404, { message: "Post not found." });
    }

    const targets = await loadPostSharingTargets(supabase, postId);
    return c.json(
      buildPostDetail({
        post: updated,
        viewerId: userId,
        sharedGroups: targets.groups,
        sharedFriends: targets.friends,
      }),
    );
  },
);

posts.delete(
  "/:postId",
  requireAuth,
  zValidator("param", postIdParamSchema),
  async (c) => {
    const { postId } = c.req.valid("param");
    const supabase = c.get("supabase");
    const userId = c.get("userId");

    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("owner_id")
      .eq("id", postId)
      .maybeSingle();

    if (fetchError) throwOnDbError(fetchError);
    if (!post) {
      throw new HTTPException(404, { message: "Post not found." });
    }
    if (post.owner_id !== userId) {
      throw new HTTPException(403, { message: "Not allowed." });
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throwOnDbError(error);

    return c.json(messageResponse("Post deleted."));
  },
);

export { posts };
