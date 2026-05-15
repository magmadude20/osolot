import {
  usernamePutBodySchema,
  usernameResponseSchema,
} from "@osolot/shared";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase-types/generated-types";
import type { Profile, ProfileInsert, ProfileUpdate } from "../supabase-types/table-types";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function adminClient(env: Env): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Map `profiles` row to the HTTP username payload (camelCase + Zod). */
function jsonUsernameResponse(row: Profile) {
  return usernameResponseSchema.parse({
    userId: row.user_id,
    username: row.username,
    updatedAt: row.updated_at,
  });
}

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    "access-control-max-age": "86400",
  };
}

function getBearer(request: Request): string | null {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) {
    return null;
  }
  const token = h.slice(7).trim();
  return token.length ? token : null;
}

async function ensureProfileRow(
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

function isUniqueViolation(err: { code?: string; message?: string }) {
  return err.code === "23505";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/username") {
      return json({ error: "not_found" }, 404);
    }

    const jwt = getBearer(request);
    if (!jwt) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabase = adminClient(env);
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(jwt);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "unauthorized" }, 401);
    }
    const sub = claimsData.claims.sub;
    if (typeof sub !== "string") {
      return json({ error: "unauthorized" }, 401);
    }
    const userId = sub;

    if (request.method === "GET") {
      try {
        await ensureProfileRow(supabase, userId);
        const { data, error } = await supabase
          .from("profiles")
          .select()
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return json({ error: "not_found" }, 404);
        }

        return json(jsonUsernameResponse(data));
      } catch (e) {
        console.error(e);
        return json({ error: "server_error" }, 500);
      }
    }

    if (request.method === "PUT") {
      let raw: unknown;
      try {
        raw = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400);
      }

      const parsed = usernamePutBodySchema.safeParse(raw);
      if (!parsed.success) {
        return json(
          { error: "validation_error", details: parsed.error.flatten() },
          400,
        );
      }

      const username = parsed.data.username;

      try {
        await ensureProfileRow(supabase, userId);
        const update: ProfileUpdate = { username };
        const { data, error } = await supabase
          .from("profiles")
          .update(update)
          .eq("user_id", userId)
          .select()
          .maybeSingle();

        if (error) {
          if (isUniqueViolation(error)) {
            return json({ error: "username_taken" }, 409);
          }
          throw error;
        }

        if (!data) {
          return json({ error: "not_found" }, 404);
        }

        return json(jsonUsernameResponse(data));
      } catch (e) {
        if (
          e &&
          typeof e === "object" &&
          "code" in e &&
          isUniqueViolation(e as { code?: string })
        ) {
          return json({ error: "username_taken" }, 409);
        }
        console.error(e);
        return json({ error: "server_error" }, 500);
      }
    }

    if (request.method === "DELETE") {
      try {
        await ensureProfileRow(supabase, userId);
        const update: ProfileUpdate = { username: null };
        const { data, error } = await supabase
          .from("profiles")
          .update(update)
          .eq("user_id", userId)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return json({ error: "not_found" }, 404);
        }

        return json(jsonUsernameResponse(data));
      } catch (e) {
        console.error(e);
        return json({ error: "server_error" }, 500);
      }
    }

    return json({ error: "method_not_allowed" }, 405);
  },
};
