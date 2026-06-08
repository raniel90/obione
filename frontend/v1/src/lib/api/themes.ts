import { api } from "./client";
import type { ThemeSuggestion } from "./types";

export function listThemeSuggestions(projectId: string): Promise<ThemeSuggestion[]> {
  return api<ThemeSuggestion[]>(`/projects/${projectId}/themes/suggestions`);
}

export function suggestTheme(projectId: string): Promise<ThemeSuggestion> {
  return api<ThemeSuggestion>(`/projects/${projectId}/themes/suggest`, { method: "POST" });
}

export function acceptThemeSuggestion(suggestionId: string): Promise<ThemeSuggestion> {
  return api<ThemeSuggestion>(`/themes/suggestions/${suggestionId}/accept`, { method: "POST" });
}
