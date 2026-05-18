import { profileResponseSchema } from "@osolot/shared";
import type { Profile, ProfileUpdate } from "../../supabase-types/table-types";

export function profileToJson(row: Profile) {
  return profileResponseSchema.parse({
    userId: row.user_id,
    username: row.username,
    bio: row.bio,
    updatedAt: row.updated_at,
  });
}

export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

export type { ProfileUpdate };
