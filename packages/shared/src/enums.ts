import { z } from "zod";

export const groupVisibilityValues = ["public", "unlisted"] as const;
export const groupVisibilitySchema = z.enum(groupVisibilityValues);
export type GroupVisibility = z.infer<typeof groupVisibilitySchema>;

export const groupAdmissionTypeValues = ["open", "application"] as const;
export const groupAdmissionTypeSchema = z.enum(groupAdmissionTypeValues);
export type GroupAdmissionType = z.infer<typeof groupAdmissionTypeSchema>;

export const membershipStatusValues = ["active", "pending"] as const;
export const membershipStatusSchema = z.enum(membershipStatusValues);
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

export const membershipRoleValues = ["admin", "moderator", "member"] as const;
export const membershipRoleSchema = z.enum(membershipRoleValues);
export type MembershipRole = z.infer<typeof membershipRoleSchema>;

export const friendshipStatusValues = [
  "active",
  "pending_sent",
  "pending_received",
] as const;
export const friendshipStatusSchema = z.enum(friendshipStatusValues);
export type FriendshipStatus = z.infer<typeof friendshipStatusSchema>;

export const postTypeValues = ["offer", "request"] as const;
export const postTypeSchema = z.enum(postTypeValues);
export type PostType = z.infer<typeof postTypeSchema>;
