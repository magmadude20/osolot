import type { SupabaseClient } from "@supabase/supabase-js";
import { HTTPException } from "hono/http-exception";
import type { Database } from "../../supabase-types/generated-types";

export interface AuthUserInfo {
  email?: string;
  emailVerified: boolean;
}

export async function getAuthUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AuthUserInfo> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    return { emailVerified: false };
  }
  return {
    email: data.user.email,
    emailVerified: data.user.email_confirmed_at != null,
  };
}

export async function requireEmailVerified(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { emailVerified } = await getAuthUser(supabase, userId);
  if (!emailVerified) {
    throw new HTTPException(403, {
      message: "Verified email required.",
    });
  }
}
