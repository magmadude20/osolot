import {
  createPostBodySchema,
  postDetailSchema,
  postSettingsSchema,
  postSummarySchema,
  type CreatePostBody,
  type PostDetail,
  type PostSettings,
  type PostSummary,
} from "@osolot/shared";
import { z } from "zod";
import { authFetch, messageSchema, optionalAuthFetch, parseJson } from "./client";

export async function listPosts(
  accessToken: string | null,
): Promise<PostSummary[]> {
  const res = await optionalAuthFetch(accessToken, "/posts/", { method: "GET" });
  return parseJson(res, z.array(postSummarySchema));
}

export async function listMyPosts(accessToken: string): Promise<PostSummary[]> {
  const res = await authFetch(accessToken, "/posts/mine", { method: "GET" });
  return parseJson(res, z.array(postSummarySchema));
}

export async function getPost(
  accessToken: string | null,
  postId: string,
): Promise<PostDetail> {
  const res = await optionalAuthFetch(accessToken, `/posts/${postId}`, {
    method: "GET",
  });
  return parseJson(res, postDetailSchema);
}

export async function createPost(
  accessToken: string,
  body: CreatePostBody,
): Promise<PostDetail> {
  const parsed = createPostBodySchema.parse(body);
  const res = await authFetch(accessToken, "/posts/", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return parseJson(res, postDetailSchema);
}

export async function updatePost(
  accessToken: string,
  postId: string,
  body: PostSettings,
): Promise<PostDetail> {
  const parsed = postSettingsSchema.parse(body);
  const res = await authFetch(accessToken, `/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(parsed),
  });
  return parseJson(res, postDetailSchema);
}

export async function deletePost(
  accessToken: string,
  postId: string,
): Promise<string> {
  const res = await authFetch(accessToken, `/posts/${postId}`, {
    method: "DELETE",
  });
  const data = await parseJson(res, messageSchema);
  return data.message;
}
