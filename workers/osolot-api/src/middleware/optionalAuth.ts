import { createMiddleware } from "hono/factory";
import type { AppBindings, OptionalAppVariables } from "../env";
import { adminClient } from "../lib/supabase";
import { bearerToken, verifyJwt } from "./auth-utils";

/** Sets `userId` when a valid JWT is present; otherwise `userId` is null. */
export const optionalAuth = createMiddleware<{
  Bindings: AppBindings;
  Variables: OptionalAppVariables;
}>(async (c, next) => {
  const supabase = adminClient(c.env);
  c.set("supabase", supabase);

  const jwt = bearerToken(c.req.header("Authorization"));
  if (!jwt) {
    c.set("userId", null);
    await next();
    return;
  }

  const userId = await verifyJwt(supabase, jwt);
  c.set("userId", userId);
  await next();
});
