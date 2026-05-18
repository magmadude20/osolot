import { describe, expect, it } from "vitest";
import {
  friendshipStatusValues,
  groupAdmissionTypeValues,
  groupVisibilityValues,
  membershipRoleValues,
  membershipStatusValues,
  postTypeValues,
} from "./enums.js";

/** Expected literals — keep in sync with supabase/schemas/*.sql check constraints. */
const DB_ENUMS = {
  groupVisibility: ["public", "unlisted"],
  groupAdmissionType: ["open", "application"],
  membershipStatus: ["active", "pending"],
  membershipRole: ["admin", "moderator", "member"],
  friendshipStatus: ["active", "pending_sent", "pending_received"],
  postType: ["offer", "request"],
} as const;

describe("enum SSOT matches database check constraints", () => {
  it("groupVisibilityValues", () => {
    expect([...groupVisibilityValues]).toEqual([...DB_ENUMS.groupVisibility]);
  });

  it("groupAdmissionTypeValues", () => {
    expect([...groupAdmissionTypeValues]).toEqual([
      ...DB_ENUMS.groupAdmissionType,
    ]);
  });

  it("membershipStatusValues", () => {
    expect([...membershipStatusValues]).toEqual([
      ...DB_ENUMS.membershipStatus,
    ]);
  });

  it("membershipRoleValues", () => {
    expect([...membershipRoleValues]).toEqual([...DB_ENUMS.membershipRole]);
  });

  it("friendshipStatusValues", () => {
    expect([...friendshipStatusValues]).toEqual([
      ...DB_ENUMS.friendshipStatus,
    ]);
  });

  it("postTypeValues", () => {
    expect([...postTypeValues]).toEqual([...DB_ENUMS.postType]);
  });
});
