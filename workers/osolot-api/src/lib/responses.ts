import { z } from "zod";

export const messageResponseSchema = z.object({
  message: z.string(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;

export function messageResponse(message: string): MessageResponse {
  return messageResponseSchema.parse({ message });
}
