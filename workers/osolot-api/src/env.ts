import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase-types/generated-types";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface AppVariables {
  supabase: SupabaseClient<Database>;
  userId: string;
}

export type AppBindings = Env;
