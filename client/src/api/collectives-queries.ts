import axios, { type AxiosError } from "axios";
import { customInstance } from "./axios-instance";
import type {
  CollectiveDetail,
  CollectiveSummary,
  MembershipDetail,
  MembershipSummary,
} from "./generated";

export function isAbortError(e: unknown): boolean {
  if (axios.isCancel(e)) return true;
  const err = e as AxiosError | undefined;
  return err?.code === "ERR_CANCELED";
}

export function fetchPublicCollectives(signal?: AbortSignal) {
  return customInstance<CollectiveSummary[]>({
    url: "/api/collectives/",
    method: "GET",
    signal,
  });
}

export function fetchCollective(collectiveId: number, signal?: AbortSignal) {
  return customInstance<CollectiveDetail>({
    url: `/api/collectives/${collectiveId}`,
    method: "GET",
    signal,
  });
}

export function fetchCollectiveMemberships(
  collectiveId: number,
  signal?: AbortSignal,
) {
  return customInstance<MembershipSummary[]>({
    url: `/api/collectives/${collectiveId}/members`,
    method: "GET",
    signal,
  });
}

export function fetchMembership(
  collectiveId: number,
  userId: number,
  signal?: AbortSignal,
) {
  return customInstance<MembershipDetail>({
    url: `/api/collectives/${collectiveId}/membership/${userId}`,
    method: "GET",
    signal,
  });
}
