import type { Tables, TablesInsert, TablesUpdate } from "./generated-types";

// Profile
export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;
