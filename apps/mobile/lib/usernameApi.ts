import {
  profileResponseSchema,
  usernamePutBodySchema,
  type ProfileResponse,
} from "@osolot/shared";

const workerBase = (process.env.EXPO_PUBLIC_WORKER_URL ?? "").replace(
  /\/+$/,
  "",
);

function assertWorkerConfigured(): void {
  if (!workerBase) {
    throw new Error(
      "Missing EXPO_PUBLIC_WORKER_URL. Copy .env.example to .env in apps/mobile.",
    );
  }
}

function apiErrorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === "object" && "error" in json) {
    const err = json.error;
    if (typeof err === "string") {
      return err;
    }
  }
  return fallback;
}

async function authFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  assertWorkerConfigured();
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${workerBase}${path}`, {
    ...init,
    headers,
  });
}

export class ProfileNotFoundError extends Error {
  constructor() {
    super("not_found");
    this.name = "ProfileNotFoundError";
  }
}

export async function getProfile(
  accessToken: string,
): Promise<ProfileResponse> {
  const res = await authFetch(accessToken, "/users/me", { method: "GET" });
  const json: unknown = await res.json().catch(() => null);
  if (res.status === 404) {
    throw new ProfileNotFoundError();
  }
  if (!res.ok) {
    throw new Error(
      apiErrorMessage(json, res.statusText) || `HTTP ${String(res.status)}`,
    );
  }
  const parsed = profileResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid response from profile API");
  }
  return parsed.data;
}

export async function putProfile(
  accessToken: string,
  username: string,
): Promise<ProfileResponse> {
  const body = usernamePutBodySchema.safeParse({ username });
  if (!body.success) {
    throw new Error(body.error.issues.map((i) => i.message).join("; "));
  }
  const res = await authFetch(accessToken, "/users/me", {
    method: "PUT",
    body: JSON.stringify(body.data),
  });
  const json: unknown = await res.json().catch(() => null);
  if (res.status === 409) {
    throw new UsernameTakenError();
  }
  if (!res.ok) {
    throw new Error(
      apiErrorMessage(json, res.statusText) || `HTTP ${String(res.status)}`,
    );
  }
  const parsed = profileResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid response from profile API");
  }
  return parsed.data;
}

export class UsernameTakenError extends Error {
  constructor() {
    super("username_taken");
    this.name = "UsernameTakenError";
  }
}
