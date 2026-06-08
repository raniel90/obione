import { api } from "./client";
import type { Draft } from "./types";

export function listDrafts(projectId: string): Promise<Draft[]> {
  return api<Draft[]>(`/projects/${projectId}/drafts`);
}

export function generateDrafts(projectId: string): Promise<Draft[]> {
  return api<Draft[]>(`/projects/${projectId}/drafts/generate`, { method: "POST" });
}

export function updateDraft(
  draftId: string,
  patch: { title?: string; body?: string },
): Promise<Draft> {
  return api<Draft>(`/drafts/${draftId}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteDraft(draftId: string): Promise<void> {
  return api<void>(`/drafts/${draftId}`, { method: "DELETE" });
}

export function publishDraft(draftId: string): Promise<Draft> {
  return api<Draft>(`/drafts/${draftId}/publish`, { method: "POST" });
}
