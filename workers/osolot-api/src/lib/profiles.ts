import { usernameResponseSchema } from "@osolot/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase-types/generated-types";
import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
} from "../../supabase-types/table-types";

export function profileToJson(row: Profile) {
  return usernameResponseSchema.parse({
    userId: row.user_id,
    username: row.username,
    updatedAt: row.updated_at,
  });
}

export async function ensureProfileRow(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const insert: ProfileInsert = { user_id: userId };
  const { error } = await supabase.from("profiles").upsert(insert, {
    onConflict: "user_id",
    ignoreDuplicates: true,
  });
  if (error) throw error;
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
