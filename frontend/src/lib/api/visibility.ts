import { api } from "./client";
import type { VisibilityState } from "./types";

export function getVisibilityState(projectId: string): Promise<VisibilityState> {
  return api<VisibilityState>(`/projects/${projectId}/visibility`);
}

export function setCategoryVisibility(
  projectId: string,
  categoryKey: string,
  visible: boolean,
): Promise<void> {
  return api<void>(`/projects/${projectId}/visibility/categories/${categoryKey}`, {
    method: "PUT",
    body: JSON.stringify({ visible }),
  });
}

export function setAttributeOverride(
  projectId: string,
  attributeKey: string,
  visible: boolean,
): Promise<void> {
  return api<void>(`/projects/${projectId}/visibility/attributes/${attributeKey}`, {
    method: "PUT",
    body: JSON.stringify({ visible }),
  });
}

export function deleteAttributeOverride(
  projectId: string,
  attributeKey: string,
): Promise<void> {
  return api<void>(`/projects/${projectId}/visibility/attributes/${attributeKey}`, {
    method: "DELETE",
  });
}
