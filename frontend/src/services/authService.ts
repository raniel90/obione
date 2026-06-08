import type { User } from "@/types/user";
import { ApiError, clearAuthToken, getAuthToken, request, setAuthToken } from "./apiClient";
import { type ApiCurrentUser, type ApiLoginResponse, mapCurrentUser } from "./apiMappers";

export interface LoginResult {
  user: User;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await request<ApiLoginResponse>("/auth/login", {
      method: "POST",
      json: { email: email.trim(), password },
    });

    setAuthToken(response.accessToken, response.user.email);

    return {
      user: mapCurrentUser(response.user),
      token: response.accessToken,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw new Error("E-mail ou senha incorretos");
    }
    throw err instanceof Error ? err : new Error("Falha na autenticação");
  }
}

export async function logout(): Promise<void> {
  clearAuthToken();
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  if (!getAuthToken()) return null;

  try {
    const me = await request<ApiCurrentUser>("/auth/me");
    return mapCurrentUser(me);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearAuthToken();
      return null;
    }
    throw err;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!getAuthToken();
}
