import { HTTPException } from "hono/http-exception";
import { isUniqueViolation } from "./profiles";

/** Map Supabase/Postgres errors to HTTP responses (handled by `app.onError`). */
export function throwOnDbError(error: unknown): never {
  if (isUniqueViolation(error)) {
    // TODO: Consider how to handle other unique constraint violations for other
    // use cases.
    throw new HTTPException(409, { message: "username_taken" });
  }
  console.error(error);
  throw new HTTPException(500, { message: "server_error" });
}
