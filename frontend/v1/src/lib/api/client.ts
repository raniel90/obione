import { ApiError } from "./error";
import { clearStoredToken, getStoredToken } from "./token";
import type { ApiErrorBody } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "network_error", "Sem conexão. Verifique sua rede.");
  }

  if (res.status === 401) {
    clearStoredToken();
    throw new ApiError(401, "unauthorized", "Sessão expirada. Faça login novamente.");
  }

  if (!res.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      /* keep empty body */
    }
    throw new ApiError(
      res.status,
      body.error?.code ?? "unknown",
      body.error?.message ?? `Request failed with status ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
