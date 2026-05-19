import { HTTPException } from "hono/http-exception";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase-types/generated-types";

export function bearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function verifyJwt(
  supabase: SupabaseClient<Database>,
  jwt: string,
): Promise<string> {
  const { data, error } = await supabase.auth.getClaims(jwt);
  if (error || !data?.claims) {
    throw new HTTPException(401, { message: "unauthorized" });
  }
  const sub = data.claims.sub;
  if (typeof sub !== "string") {
    throw new HTTPException(401, { message: "unauthorized" });
  }
  return sub;
}
