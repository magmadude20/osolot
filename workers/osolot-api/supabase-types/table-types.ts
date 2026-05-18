import type { Tables, TablesInsert, TablesUpdate } from "./generated-types";

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type Group = Tables<"groups">;
export type GroupInsert = TablesInsert<"groups">;
export type GroupUpdate = TablesUpdate<"groups">;

export type Membership = Tables<"memberships">;
export type MembershipInsert = TablesInsert<"memberships">;
export type MembershipUpdate = TablesUpdate<"memberships">;

export type Friendship = Tables<"friendships">;
export type FriendshipInsert = TablesInsert<"friendships">;
export type FriendshipUpdate = TablesUpdate<"friendships">;

export type Post = Tables<"posts">;
export type PostInsert = TablesInsert<"posts">;
export type PostUpdate = TablesUpdate<"posts">;
