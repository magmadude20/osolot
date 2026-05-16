import { zValidator } from "@hono/zod-validator";
import { usernamePutBodySchema } from "@osolot/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppBindings, AppVariables } from "../env";
import { throwOnDbError } from "../lib/db-error";
import { ensureProfileRow, profileToJson } from "../lib/profiles";
import { adminClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

const usernameParamSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/i)
    .transform((s) => s.toLowerCase()),
});

const users = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

users.get("/me", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  await ensureProfileRow(supabase, userId).catch(throwOnDbError);
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

    await ensureProfileRow(supabase, userId).catch(throwOnDbError);
    const { data, error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) throwOnDbError(error);
    if (!data) {
      throw new HTTPException(404, { message: "not_found" });
    }

    return c.json(profileToJson(data));
  },
);

users.delete("/me", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  await ensureProfileRow(supabase, userId).catch(throwOnDbError);
  const { data, error } = await supabase
    .from("profiles")
    .update({ username: null })
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throwOnDbError(error);
  if (!data) {
    throw new HTTPException(404, { message: "not_found" });
  }

  return c.json(profileToJson(data));
});

/** Public lookup by username (stored lowercase). */
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
