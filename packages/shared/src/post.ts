import { z } from "zod";
import { postTypeSchema } from "./enums.js";
import { groupSummarySchema } from "./group.js";
import { userSummarySchema } from "./user.js";

export const postTitleSchema = z.string().min(1).max(255);
export const postDescriptionSchema = z.string().max(10000);

export const postSharingSummarySchema = z.object({
  public: z.boolean(),
  shareWithNewGroupsDefault: z.boolean(),
  shareWithNewFriendsDefault: z.boolean(),
});

export type PostSharingSummary = z.infer<typeof postSharingSummarySchema>;

export const postSharingDetailSchema = postSharingSummarySchema.extend({
  sharedGroups: z.array(groupSummarySchema),
  sharedFriends: z.array(userSummarySchema),
});

export type PostSharingDetail = z.infer<typeof postSharingDetailSchema>;

export const postSummarySchema = z.object({
  id: z.uuid(),
  type: postTypeSchema,
  title: postTitleSchema,
  owner: userSummarySchema,
  sharing: postSharingSummarySchema.nullable().optional(),
});

export type PostSummary = z.infer<typeof postSummarySchema>;

export const postDetailSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  type: postTypeSchema,
  title: postTitleSchema,
  description: postDescriptionSchema,
  owner: userSummarySchema,
  sharing: postSharingDetailSchema.nullable().optional(),
});

export type PostDetail = z.infer<typeof postDetailSchema>;

export const postSettingsSchema = z
  .object({
    type: postTypeSchema.optional(),
    title: postTitleSchema.optional(),
    description: postDescriptionSchema.optional(),
    public: z.boolean().optional(),
    shareWithNewGroupsDefault: z.boolean().optional(),
    sharedGroupIds: z.array(z.uuid()).nullable().optional(),
    shareWithNewFriendsDefault: z.boolean().optional(),
    sharedFriendUsernames: z.array(z.string()).nullable().optional(),
  })
  .strict();

export type PostSettings = z.infer<typeof postSettingsSchema>;

export const createPostBodySchema = z
  .object({
    type: postTypeSchema,
    title: postTitleSchema,
    description: postDescriptionSchema,
    public: z.boolean().default(false),
    shareWithNewGroupsDefault: z.boolean().default(true),
    shareWithNewFriendsDefault: z.boolean().default(true),
    sharedGroupIds: z.array(z.uuid()).default([]),
    sharedFriendUsernames: z.array(z.string()).default([]),
  })
  .strict();

export type CreatePostBody = z.infer<typeof createPostBodySchema>;
