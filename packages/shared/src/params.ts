import { z } from "zod";

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid(),
});

export const postIdParamSchema = z.object({
  postId: z.string().uuid(),
});
