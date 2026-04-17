import { createContext, useContext } from "react";
import type { RegisterIn, UpdateProfileRequest, UserProfile } from "../api/generated";

export type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterIn) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
