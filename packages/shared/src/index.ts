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

export const profileResponseSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  bio: z.string(),
  updatedAt: z.string(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;

/** @deprecated Use profileResponseSchema */
export const usernameResponseSchema = profileResponseSchema;

/** @deprecated Use ProfileResponse */
export type UsernameResponse = ProfileResponse;
