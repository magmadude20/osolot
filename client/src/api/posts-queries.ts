import axios, { type AxiosError } from "axios";
import { customInstance } from "./axios-instance";
import type { PostDetail, PostSummary } from "./generated";

export function isAbortError(e: unknown): boolean {
  if (axios.isCancel(e)) return true;
  const err = e as AxiosError | undefined;
  return err?.code === "ERR_CANCELED";
}

/** Server post slug: 16 alphanumeric chars (same pattern as collective slugs). */
const POST_SLUG_RE = /^[A-Za-z0-9]{16}$/;

export function isValidPostSlug(s: string | undefined): boolean {
  if (s === undefined || s === "") return false;
  return POST_SLUG_RE.test(s);
}

/**
 * Posts visible to the current viewer (anonymous: public only; signed-in: own + public + shared).
 * Not yet in generated OpenAPI; matches server `GET /api/posts/`.
 */
export function fetchVisiblePosts(signal?: AbortSignal) {
  return customInstance<PostSummary[]>({
    url: "/api/posts/",
    method: "GET",
    signal,
  });
}

export function fetchPostDetail(postSlug: string, signal?: AbortSignal) {
  return customInstance<PostDetail>({
    url: `/api/posts/${postSlug}`,
    method: "GET",
    signal,
  });
}
