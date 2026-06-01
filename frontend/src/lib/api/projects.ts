import { api } from "./client";
import type { Project, ProjectDetail } from "./types";

export function listProjects(): Promise<Project[]> {
  return api<Project[]>("/projects");
}

export function getProjectDetail(id: string): Promise<ProjectDetail> {
  return api<ProjectDetail>(`/projects/${id}/detail`);
}
