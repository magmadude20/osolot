import { userProfileSchema, type UserProfile } from "@osolot/shared";
import type { Profile } from "../../supabase-types/table-types";
import type { AuthUserInfo } from "../lib/auth-user";

export function toUserProfile(
  profile: Profile,
  auth: AuthUserInfo,
): UserProfile {
  return userProfileSchema.parse({
    username: profile.username,
    bio: profile.bio,
    email: auth.email,
    emailVerified: auth.emailVerified,
  });
}
