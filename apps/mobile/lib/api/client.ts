import { z } from "zod";

const workerBase = (process.env.EXPO_PUBLIC_WORKER_URL ?? "").replace(
  /\/+$/,
  "",
);

export function assertWorkerConfigured(): void {
  if (!workerBase) {
    throw new Error(
      "Missing EXPO_PUBLIC_WORKER_URL. Copy .env.example to .env in apps/mobile.",
    );
  }
}

function apiErrorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === "object" && "message" in json) {
    const msg = (json as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error: unknown }).error;
    if (typeof err === "string") return err;
  }
  return fallback;
}

export async function authFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  assertWorkerConfigured();
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${workerBase}${path}`, { ...init, headers });
}

export async function optionalAuthFetch(
  accessToken: string | null,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  assertWorkerConfigured();
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return fetch(`${workerBase}${path}`, { ...init, headers });
}

export async function parseJson<T>(
  res: Response,
  schema: z.ZodType<T>,
  fallback = "Request failed",
): Promise<T> {
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(apiErrorMessage(json, res.statusText) || `HTTP ${res.status}`);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid response from API");
  }
  return parsed.data;
}

export const messageSchema = z.object({ message: z.string() });
