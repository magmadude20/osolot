import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppBindings, AppVariables } from "../env";
import { adminClient } from "../lib/supabase";
import { bearerToken, verifyJwt } from "./auth-utils";

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
  c.set("supabase", supabase);
  c.set("userId", await verifyJwt(supabase, jwt));
  await next();
});
