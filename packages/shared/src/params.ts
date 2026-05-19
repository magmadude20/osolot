import { z } from "zod";

export const uuidParamSchema = z.object({
  id: z.uuid(),
});

export const groupIdParamSchema = z.object({
  groupId: z.uuid(),
});

export const postIdParamSchema = z.object({
  postId: z.uuid(),
});
