import { z } from "zod";
import { friendshipStatusSchema } from "./enums.js";

export const userSummarySchema = z.object({
  username: z.string(),
  friendshipStatus: friendshipStatusSchema.nullable().optional(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

import { groupSummarySchema } from "./group.js";
import { postSummarySchema } from "./post.js";

export const userDetailSchema = z.object({
  summary: userSummarySchema,
  bio: z.string().nullable().optional(),
  friendshipStatus: friendshipStatusSchema.nullable().optional(),
  mutualGroups: z.array(groupSummarySchema),
  mutualFriends: z.array(userSummarySchema),
  postsSharedWithMe: z.array(postSummarySchema),
});

export type UserDetail = z.infer<typeof userDetailSchema>;
