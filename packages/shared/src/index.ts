import { z } from "zod";

const USERNAME_RE = /^[a-z0-9_]+$/;

export const usernameInputSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(USERNAME_RE, "Only lowercase letters, digits, and underscore")
  .transform((s) => s.toLowerCase());

export type UsernameInput = z.infer<typeof usernameInputSchema>;

export const usernamePutBodySchema = z.object({
  username: usernameInputSchema,
});

export type UsernamePutBody = z.infer<typeof usernamePutBodySchema>;

export const usernameResponseSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().nullable(),
  updatedAt: z.string(),
});

export type UsernameResponse = z.infer<typeof usernameResponseSchema>;
