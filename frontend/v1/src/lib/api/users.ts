import { api } from "./client";
import type { Role, User } from "./types";

/** List users (staff-only on the backend), optionally filtered by role. */
export function listUsers(role?: Role): Promise<User[]> {
  const qs = role ? `?role=${role}` : "";
  return api<User[]>(`/auth/users${qs}`);
}

/** Convenience: the clients a consultant can link to a project. */
export function listClients(): Promise<User[]> {
  return listUsers("client");
}
