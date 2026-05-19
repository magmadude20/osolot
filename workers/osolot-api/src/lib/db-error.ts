import { HTTPException } from "hono/http-exception";

export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

/** Map Supabase/Postgres errors to HTTP responses (handled by `app.onError`). */
export function throwOnDbError(error: unknown): never {
  if (isUniqueViolation(error)) {
    throw new HTTPException(409, { message: "username_taken" });
  }
  console.error(error);
  throw new HTTPException(500, { message: "server_error" });
}
