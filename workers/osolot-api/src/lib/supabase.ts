import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase-types/generated-types";
import type { Env } from "../env";

export function adminClient(env: Env): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
