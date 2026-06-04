import { api } from "./client";
import type { Synthesis } from "./types";

/** Staff: full draft + published history of a temática (domain). */
export function listSyntheses(domain: string): Promise<Synthesis[]> {
  return api<Synthesis[]>(`/themes/${domain}/syntheses`);
}

/** Staff: generate one synthesis (draft) from the theme's projects. */
export function generateSynthesis(domain: string): Promise<Synthesis> {
  return api<Synthesis>(`/themes/${domain}/syntheses/generate`, { method: "POST" });
}

/** Anyone who can see the project: published syntheses of its temática. */
export function listProjectSyntheses(projectId: string): Promise<Synthesis[]> {
  return api<Synthesis[]>(`/projects/${projectId}/syntheses`);
}

export function updateSynthesis(
  id: string,
  patch: { title?: string; body?: string },
): Promise<Synthesis> {
  return api<Synthesis>(`/syntheses/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteSynthesis(id: string): Promise<void> {
  return api<void>(`/syntheses/${id}`, { method: "DELETE" });
}

export function publishSynthesis(id: string): Promise<Synthesis> {
  return api<Synthesis>(`/syntheses/${id}/publish`, { method: "POST" });
}
