import { z } from "zod";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "./env";
import { users } from "./routes/users";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.route("/users", users);

app.notFound((c) => c.json({ error: "not_found" }, 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  if (err instanceof z.ZodError) {
    return c.json(
      { error: "validation_error", details: err.flatten() },
      400,
    );
  }
  console.error(err);
  return c.json({ error: "server_error" }, 500);
});

export default app;
