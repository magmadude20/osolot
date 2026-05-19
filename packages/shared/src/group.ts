import { z } from "zod";
import {
  groupAdmissionTypeSchema,
  groupVisibilitySchema,
  membershipRoleSchema,
  membershipStatusSchema,
} from "./enums.js";

export const descriptionSchema = z.string().max(10000);

export const groupSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: descriptionSchema,
  visibility: groupVisibilitySchema,
  admissionType: groupAdmissionTypeSchema,
  membershipStatus: membershipStatusSchema.nullable().optional(),
  membershipRole: membershipRoleSchema.nullable().optional(),
});

export type GroupSummary = z.infer<typeof groupSummarySchema>;

export const groupSettingsSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: descriptionSchema.optional(),
    visibility: groupVisibilitySchema.optional(),
    admissionType: groupAdmissionTypeSchema.optional(),
    applicationQuestion: z.string().max(10000).optional(),
  })
  .strict();

export type GroupSettings = z.infer<typeof groupSettingsSchema>;

export const createGroupBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    description: descriptionSchema.default(""),
    visibility: groupVisibilitySchema.default("public"),
    admissionType: groupAdmissionTypeSchema.default("open"),
    applicationQuestion: z.string().max(10000).default(""),
  })
  .strict();

export type CreateGroupBody = z.infer<typeof createGroupBodySchema>;

import { membershipSummarySchema } from "./membership.js";
import { postSummarySchema } from "./post.js";

export const groupDetailSchema = z.object({
  summary: groupSummarySchema,
  members: z.array(membershipSummarySchema),
  applicationQuestion: z.string(),
  sharedPosts: z.array(postSummarySchema),
});

export type GroupDetail = z.infer<typeof groupDetailSchema>;
