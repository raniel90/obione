import { api } from "./client";
import type { ExtractionRun } from "./types";

export function listExtractions(projectId: string): Promise<ExtractionRun[]> {
  return api<ExtractionRun[]>(`/projects/${projectId}/extractions`);
}
