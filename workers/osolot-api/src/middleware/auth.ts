import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppBindings, AppVariables } from "../env";
import { adminClient } from "../lib/supabase";

function bearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Verifies JWT via Supabase `getClaims` and sets `supabase` + `userId` on context. */
export const requireAuth = createMiddleware<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>(async (c, next) => {
  const jwt = bearerToken(c.req.header("Authorization"));
  if (!jwt) {
    throw new HTTPException(401, { message: "unauthorized" });
  }

  const supabase = adminClient(c.env);
  const { data, error } = await supabase.auth.getClaims(jwt);
  if (error || !data?.claims) {
    throw new HTTPException(401, { message: "unauthorized" });
  }

  const sub = data.claims.sub;
  if (typeof sub !== "string") {
    throw new HTTPException(401, { message: "unauthorized" });
  }

  c.set("supabase", supabase);
  c.set("userId", sub);
  await next();
});
