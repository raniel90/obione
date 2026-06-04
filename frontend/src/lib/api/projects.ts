import { api } from "./client";
import type { Project, ProjectCreate, ProjectDetail } from "./types";

export function listProjects(): Promise<Project[]> {
  return api<Project[]>("/projects");
}

export function getProjectDetail(id: string): Promise<ProjectDetail> {
  return api<ProjectDetail>(`/projects/${id}/detail`);
}

export function createProject(body: ProjectCreate): Promise<Project> {
  return api<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function addProjectClient(projectId: string, userId: string): Promise<void> {
  return api<void>(`/projects/${projectId}/clients`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}
