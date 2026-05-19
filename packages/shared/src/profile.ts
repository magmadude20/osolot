import { z } from "zod";

const USERNAME_RE = /^[\w.-]+$/;

export const usernameInputSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(
    USERNAME_RE,
    "Only letters, digits, underscore, period, and hyphen",
  );

export type UsernameInput = z.infer<typeof usernameInputSchema>;

export const usernamePutBodySchema = z.object({
  username: usernameInputSchema,
});

export type UsernamePutBody = z.infer<typeof usernamePutBodySchema>;

export const usernameParamSchema = z.object({
  username: usernameInputSchema,
});

export const bioSchema = z.string().max(10000);

export const userProfileSchema = z.object({
  username: usernameInputSchema,
  bio: bioSchema,
  email: z.email().optional(),
  emailVerified: z.boolean().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateProfileRequestSchema = userProfileSchema
  .pick({ username: true, bio: true })
  .partial()
  .strict();

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const profileResponseSchema = z.object({
  userId: z.uuid(),
  username: z.string(),
  bio: z.string(),
  updatedAt: z.iso.datetime(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
