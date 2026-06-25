// Relative by default so the app works behind a single origin (e.g. a
// Cloudflare quick tunnel): the Vite dev server proxies "/api" to the backend.
// Override with VITE_API_BASE_URL for a split frontend/backend deploy.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "obione-auth";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string };
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string, email?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ access_token: token, token_type: "Bearer", email }),
    );
  } catch {
    /* noop */
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export interface RequestOptions extends RequestInit {
  json?: unknown;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (body.message) return body.message;
  } catch {
    /* fall through */
  }
  return res.statusText || `Erro HTTP ${res.status}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers: initHeaders, ...rest } = options;

  const headers = new Headers(initHeaders);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    // A 401 means the mock session died (backend restart) or the token is
    // stale — drop it and send the user back to login instead of silently
    // rendering empty screens.
    if (res.status === 401 && typeof window !== "undefined" && path !== "/auth/login") {
      clearAuthToken();
      const here = window.location.pathname;
      if (here !== "/login" && here !== "/register") {
        window.location.assign("/login");
      }
    }
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await res.json()) as T;
  }

  return undefined as T;
}

/** Simulate network latency for mock services. */
export function delay<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
