import type { Project, ProjectStatusCode } from "@/types/project";
import { request } from "./apiClient";
import { type ApiProject, mapProject } from "./apiMappers";

function toOptionalId(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCreateBody(data: Omit<Project, "id" | "createdAt" | "updatedAt">) {
  const body: Record<string, unknown> = {
    name: data.name,
    domainId: Number(data.domainId),
    type: data.type,
    summary: data.summary,
    observationObjective: data.observationObjective,
    initialAttributeIds: data.initialAttributeIds ?? [],
    expectedPhenomena: data.expectedPhenomena ?? [],
    progress: data.progress ?? 0,
    riskLevel: data.riskLevel ?? "LOW",
    clientEngagement: data.clientEngagement ?? "MEDIUM",
    status: data.status ?? "OBSERVATION",
  };

  const clientId = toOptionalId(data.clientId);
  const consultantId = toOptionalId(data.consultantId);
  if (clientId !== undefined) body.clientId = clientId;
  if (consultantId !== undefined) body.consultantId = consultantId;
  if (data.startDate) body.startDate = data.startDate;
  if (data.expectedEndDate) body.expectedEndDate = data.expectedEndDate;

  return body;
}

function buildUpdateBody(data: Partial<Project>) {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.domainId !== undefined) body.domainId = Number(data.domainId);
  if (data.type !== undefined) body.type = data.type;
  if (data.status !== undefined) body.status = data.status;
  if (data.summary !== undefined) body.summary = data.summary;
  if (data.observationObjective !== undefined)
    body.observationObjective = data.observationObjective;
  if (data.initialAttributeIds !== undefined) body.initialAttributeIds = data.initialAttributeIds;
  if (data.expectedPhenomena !== undefined) body.expectedPhenomena = data.expectedPhenomena;
  if (data.progress !== undefined) body.progress = data.progress;
  if (data.riskLevel !== undefined) body.riskLevel = data.riskLevel;
  if (data.clientEngagement !== undefined) body.clientEngagement = data.clientEngagement;
  if (data.startDate !== undefined) body.startDate = data.startDate || null;
  if (data.expectedEndDate !== undefined) body.expectedEndDate = data.expectedEndDate || null;

  const clientId = data.clientId !== undefined ? toOptionalId(data.clientId) : undefined;
  const consultantId =
    data.consultantId !== undefined ? toOptionalId(data.consultantId) : undefined;
  if (data.clientId !== undefined) body.clientId = clientId ?? null;
  if (data.consultantId !== undefined) body.consultantId = consultantId ?? null;

  return body;
}

export async function getProjects(): Promise<Project[]> {
  const data = await request<ApiProject[]>("/projects");
  return data.map(mapProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const data = await request<ApiProject>(`/projects/${id}`);
    return mapProject(data);
  } catch {
    return null;
  }
}

export async function getProjectsByDomain(domainId: string): Promise<Project[]> {
  const data = await request<ApiProject[]>(`/projects/domain/${domainId}`);
  return data.map(mapProject);
}

export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">,
): Promise<Project> {
  const created = await request<ApiProject>("/projects", {
    method: "POST",
    json: buildCreateBody(data),
  });
  return mapProject(created);
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project | null> {
  try {
    const updated = await request<ApiProject>(`/projects/${id}`, {
      method: "PUT",
      json: buildUpdateBody(data),
    });
    return mapProject(updated);
  } catch {
    return null;
  }
}

export async function updateProjectStatus(
  id: string,
  data: { status: ProjectStatusCode; note?: string },
): Promise<Project | null> {
  try {
    const updated = await request<ApiProject>(`/projects/${id}/status`, {
      method: "PATCH",
      json: {
        status: data.status,
        note: data.note,
      },
    });
    return mapProject(updated);
  } catch {
    return null;
  }
}

export async function closeProjectObservation(
  id: string,
  data: {
    summary?: string;
    recommendation?: string;
    lessonsLearned?: string;
    identifiedPatterns?: string;
  } = {},
): Promise<Project | null> {
  try {
    const updated = await request<ApiProject>(`/projects/${id}/close-observation`, {
      method: "POST",
      json: {
        closureSummary: data.summary,
        futureRecommendation: data.recommendation,
        lessonsLearned: data.lessonsLearned,
        identifiedPatterns: data.identifiedPatterns,
      },
    });
    return mapProject(updated);
  } catch {
    return null;
  }
}
