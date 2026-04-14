import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getOsolotAPI,
  type RegisterIn,
  type UpdateProfileRequest,
  type UserProfile,
} from "../api/generated";
import { clearTokens, getAccessToken, setTokens } from "../api/axios-instance";
import { AuthContext } from "./AuthContext";

const api = getOsolotAPI();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await api.osolotServerApiUsersMe();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getAccessToken()) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await api.osolotServerApiUsersMe();
        if (!cancelled) setUser(me);
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.osolotServerApiAuthLogin({ email, password });
    setTokens(tokens.access, tokens.refresh);
    await refreshMe();
  }, [refreshMe]);

  const register = useCallback(async (data: RegisterIn) => {
    const tokens = await api.osolotServerApiAuthRegister(data);
    setTokens(tokens.access, tokens.refresh);
    await refreshMe();
  }, [refreshMe]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    const updated = await api.osolotServerApiUsersUpdateMe(data);
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshMe,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, loading, refreshMe, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
