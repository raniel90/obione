import type { Phenomenon } from "@/types/phenomenon";
import { request } from "./apiClient";
import { type ApiPhenomenon, mapPhenomenon } from "./apiMappers";

function toOptionalId(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCreateBody(data: Omit<Phenomenon, "id">) {
  const body: Record<string, unknown> = {
    name: data.name,
    domainId: Number(data.domainId),
    description: data.description,
    evidenceCount: data.evidenceCount ?? 0,
    relatedAttributeIds: data.relatedAttributeIds ?? [],
    impact: data.impact,
    trend: data.trend,
    status: data.status,
  };

  const projectId = toOptionalId(data.projectId);
  if (projectId !== undefined) body.projectId = projectId;

  return body;
}

function buildUpdateBody(data: Partial<Phenomenon>) {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.domainId !== undefined) body.domainId = Number(data.domainId);
  if (data.description !== undefined) body.description = data.description;
  if (data.evidenceCount !== undefined) body.evidenceCount = data.evidenceCount;
  if (data.relatedAttributeIds !== undefined) body.relatedAttributeIds = data.relatedAttributeIds;
  if (data.impact !== undefined) body.impact = data.impact;
  if (data.trend !== undefined) body.trend = data.trend;
  if (data.status !== undefined) body.status = data.status;

  if (data.projectId !== undefined) {
    const projectId = toOptionalId(data.projectId);
    body.projectId = projectId ?? null;
  }

  return body;
}

export async function getPhenomena(): Promise<Phenomenon[]> {
  const data = await request<ApiPhenomenon[]>("/phenomena");
  return data.map(mapPhenomenon);
}

export async function getPhenomenonById(id: string): Promise<Phenomenon | null> {
  try {
    const data = await request<ApiPhenomenon>(`/phenomena/${id}`);
    return mapPhenomenon(data);
  } catch {
    return null;
  }
}

export async function getPhenomenaByProject(projectId: string): Promise<Phenomenon[]> {
  const data = await request<ApiPhenomenon[]>(`/projects/${projectId}/phenomena`);
  return data.map(mapPhenomenon);
}

export async function getPhenomenaByDomain(domainId: string): Promise<Phenomenon[]> {
  const data = await request<ApiPhenomenon[]>(`/domains/${domainId}/phenomena`);
  return data.map(mapPhenomenon);
}

export async function createPhenomenon(data: Omit<Phenomenon, "id">): Promise<Phenomenon> {
  const created = await request<ApiPhenomenon>("/phenomena", {
    method: "POST",
    json: buildCreateBody(data),
  });
  return mapPhenomenon(created);
}

export async function updatePhenomenon(
  id: string,
  data: Partial<Phenomenon>,
): Promise<Phenomenon | null> {
  try {
    const updated = await request<ApiPhenomenon>(`/phenomena/${id}`, {
      method: "PUT",
      json: buildUpdateBody(data),
    });
    return mapPhenomenon(updated);
  } catch {
    return null;
  }
}
