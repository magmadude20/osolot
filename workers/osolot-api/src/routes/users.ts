import {
  usernameParamSchema,
  usernamePutBodySchema,
} from "@osolot/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppBindings, AppVariables } from "../env";
import { throwOnDbError } from "../lib/db-error";
import { profileToJson } from "../lib/profiles";
import { adminClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

const users = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

users.get("/me", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throwOnDbError(error);
  if (!data) {
    throw new HTTPException(404, { message: "not_found" });
  }

  return c.json(profileToJson(data));
});

users.put(
  "/me",
  requireAuth,
  zValidator("json", usernamePutBodySchema),
  async (c) => {
    const supabase = c.get("supabase");
    const userId = c.get("userId");
    const { username } = c.req.valid("json");

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, username }, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) throwOnDbError(error);

    return c.json(profileToJson(data));
  },
);

/** Public lookup by username (case-insensitive via citext). */
users.get(
  "/:username",
  zValidator("param", usernameParamSchema),
  async (c) => {
    const { username } = c.req.valid("param");
    const supabase = adminClient(c.env);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) throwOnDbError(error);
    if (!data) {
      throw new HTTPException(404, { message: "not_found" });
    }

    return c.json(profileToJson(data));
  },
);

export { users };
