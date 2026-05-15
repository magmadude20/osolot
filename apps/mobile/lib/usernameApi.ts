import {
  usernamePutBodySchema,
  usernameResponseSchema,
  type UsernameResponse,
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

async function authFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  assertWorkerConfigured();
  return fetch(`${workerBase}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
}

export async function getUsername(
  accessToken: string,
): Promise<UsernameResponse> {
  const res = await authFetch(accessToken, "/username", { method: "GET" });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json && typeof json === "object" && "error" in json
      ? String((json as { error: unknown }).error)
      : res.statusText;
    throw new Error(err || `HTTP ${res.status}`);
  }
  const parsed = usernameResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid response from username API");
  }
  return parsed.data;
}

export async function putUsername(
  accessToken: string,
  username: string,
): Promise<UsernameResponse> {
  const body = usernamePutBodySchema.safeParse({ username });
  if (!body.success) {
    throw new Error(body.error.issues.map((i) => i.message).join("; "));
  }
  const res = await authFetch(accessToken, "/username", {
    method: "PUT",
    body: JSON.stringify(body.data),
  });
  const json: unknown = await res.json().catch(() => null);
  if (res.status === 409) {
    throw new UsernameTakenError();
  }
  if (!res.ok) {
    const err = json && typeof json === "object" && "error" in json
      ? String((json as { error: unknown }).error)
      : res.statusText;
    throw new Error(err || `HTTP ${res.status}`);
  }
  const parsed = usernameResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid response from username API");
  }
  return parsed.data;
}

export class UsernameTakenError extends Error {
  constructor() {
    super("username_taken");
    this.name = "UsernameTakenError";
  }
}

export async function deleteUsername(
  accessToken: string,
): Promise<UsernameResponse> {
  const res = await authFetch(accessToken, "/username", { method: "DELETE" });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json && typeof json === "object" && "error" in json
      ? String((json as { error: unknown }).error)
      : res.statusText;
    throw new Error(err || `HTTP ${res.status}`);
  }
  const parsed = usernameResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid response from username API");
  }
  return parsed.data;
}
