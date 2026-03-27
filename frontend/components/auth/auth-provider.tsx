"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { fetchAuthMe, fetchAuthMode, loginLocal } from "@/lib/api";
import { authConfigured, loginWithMicrosoft, logoutMicrosoft } from "@/lib/auth";

export type AuthProfile = {
  email: string;
  is_admin_principal: boolean;
  can_import: boolean;
};

type AuthContextValue = {
  loading: boolean;
  token: string | null;
  profile: AuthProfile | null;
  error: string | null;
  authMode: "local" | "microsoft";
  isConfigured: boolean;
  loginMicrosoft: () => Promise<void>;
  loginLocal: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const TOKEN_STORAGE_KEY = "bi_manutencao_auth_token";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function saveStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;

  if (!token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"local" | "microsoft">("local");

  async function refreshProfileWithToken(nextToken: string | null) {
    if (!nextToken) {
      setProfile(null);
      return;
    }

    const me = await fetchAuthMe(nextToken);
    setProfile(me);
  }

  async function refreshProfile() {
    if (!token) {
      setProfile(null);
      return;
    }

    try {
      const me = await fetchAuthMe(token);
      setProfile(me);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao validar sessao.";
      setError(message);
      setToken(null);
      setProfile(null);
      saveStoredToken(null);
    }
  }

  async function loginMicrosoft() {
    setLoading(true);
    try {
      const newToken = await loginWithMicrosoft();
      saveStoredToken(newToken);
      setToken(newToken);
      await refreshProfileWithToken(newToken);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha no login Microsoft.";
      setError(message);
      saveStoredToken(null);
      setToken(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function loginLocalWithPassword(email: string, password: string) {
    setLoading(true);
    try {
      const newToken = await loginLocal(email, password);
      saveStoredToken(newToken);
      setToken(newToken);
      await refreshProfileWithToken(newToken);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha no login local.";
      setError(message);
      saveStoredToken(null);
      setToken(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await logoutMicrosoft();
    } catch {
      // Ignore logout popup failures and clear local session anyway.
    } finally {
      saveStoredToken(null);
      setToken(null);
      setProfile(null);
      setError(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        const modeResponse = await fetchAuthMode();
        if (active) {
          setAuthMode(modeResponse.auth_mode === "microsoft" ? "microsoft" : "local");
        }
      } catch {
        if (active) {
          setAuthMode("local");
        }
      }

      const initialToken = readStoredToken();
      if (!active) return;

      setToken(initialToken);

      if (!initialToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchAuthMe(initialToken);
        if (!active) return;
        setProfile(me);
        setError(null);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Sessao invalida.";
        setError(message);
        setToken(null);
        setProfile(null);
        saveStoredToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void boot();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      token,
      profile,
      error,
      authMode,
      isConfigured: authMode === "microsoft" ? authConfigured : true,
      loginMicrosoft,
      loginLocal: loginLocalWithPassword,
      logout,
      refreshProfile,
    }),
    [authMode, loading, token, profile, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
