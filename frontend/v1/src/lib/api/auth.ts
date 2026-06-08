import { api } from "./client";
import type { LoginRequest, TokenResponse, User } from "./types";

export function login(payload: LoginRequest): Promise<TokenResponse> {
  return api<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function me(): Promise<User> {
  return api<User>("/auth/me");
}
