import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "./api/auth";
import { clearStoredToken, setStoredToken } from "./api/token";
import { getStoredToken } from "./api/token";
import type { User } from "./api/types";

type Status = "loading" | "unauthenticated" | "authenticated";

type AuthShared = {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

type AuthValue =
  | ({ status: "loading"; user: null } & AuthShared)
  | ({ status: "unauthenticated"; user: null } & AuthShared)
  | ({ status: "authenticated"; user: User } & AuthShared);

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);

  // Bootstrap: if there's a stored token, validate it via /me.
  // The no-token path is deferred to a microtask so the initial "loading"
  // status is observable to consumers (e.g. for splash screens / guards),
  // matching the async semantics of the token-present branch.
  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();
    if (!token) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setStatus("unauthenticated");
      });
      return () => {
        cancelled = true;
      };
    }
    authApi
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredToken();
        setUser(null);
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tok = await authApi.login({ email, password });
    setStoredToken(tok.access_token);
    const u = await authApi.me();
    setUser(u);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value: AuthValue =
    status === "authenticated"
      ? { status, user: user as User, login, logout }
      : { status, user: null, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// Helper for components that require auth — narrows the type at the call site.
// eslint-disable-next-line react-refresh/only-export-components
export function useUser(): User {
  const a = useAuth();
  if (a.status !== "authenticated") {
    throw new Error("useUser called while unauthenticated — wrap component in <RequireAuth>");
  }
  return a.user;
}
