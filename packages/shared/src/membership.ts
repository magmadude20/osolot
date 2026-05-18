import { z } from "zod";
import { membershipRoleSchema, membershipStatusSchema } from "./enums.js";
import { groupSummarySchema } from "./group.js";
import { userSummarySchema } from "./user.js";

export const applicationMessageSchema = z.string().max(10000);

export const membershipSummarySchema = z.object({
  user: userSummarySchema,
  group: groupSummarySchema,
  status: membershipStatusSchema,
  role: membershipRoleSchema,
});

export type MembershipSummary = z.infer<typeof membershipSummarySchema>;

export const joinGroupRequestSchema = z
  .object({
    applicationMessage: applicationMessageSchema.default(""),
    sharedPostIds: z.array(z.string().uuid()).default([]),
  })
  .strict();

export type JoinGroupRequest = z.infer<typeof joinGroupRequestSchema>;

export const updateMembershipRequestSchema = z
  .object({
    applicationMessage: applicationMessageSchema.nullable().optional(),
    sharedPostIds: z.array(z.string().uuid()).nullable().optional(),
    status: membershipStatusSchema.nullable().optional(),
    role: membershipRoleSchema.nullable().optional(),
  })
  .strict();

export type UpdateMembershipRequest = z.infer<
  typeof updateMembershipRequestSchema
>;

import { postSummarySchema } from "./post.js";

export const membershipDetailSchema = z.object({
  summary: membershipSummarySchema,
  sharedPosts: z.array(postSummarySchema).nullable().optional(),
  applicationMessage: applicationMessageSchema.nullable().optional(),
  appliedAt: z.string().datetime().nullable().optional(),
  joinedAt: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime().nullable().optional(),
  approvedBy: userSummarySchema.nullable().optional(),
});

export type MembershipDetail = z.infer<typeof membershipDetailSchema>;
