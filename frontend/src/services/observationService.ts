import type { Observation } from "@/types/observation";
import { request } from "./apiClient";
import { type ApiObservation, mapObservation } from "./apiMappers";

function toOptionalId(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCreateBody(
  data: Omit<Observation, "id" | "projectId" | "createdAt" | "createdByName">,
) {
  const body: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    attributeId: data.attributeId || undefined,
    phenomenonId: data.phenomenonId,
    impact: data.impact,
    risk: data.risk,
    interpretation: data.interpretation || undefined,
    status: data.status,
  };

  if (data.origin !== undefined) body.origin = data.origin;
  if (data.sourceExcerpt) body.sourceExcerpt = data.sourceExcerpt;
  if (data.suggestionId !== undefined) body.suggestionId = data.suggestionId;

  const createdById = toOptionalId(data.createdBy);
  if (createdById !== undefined) body.createdById = createdById;

  return body;
}

function buildUpdateBody(data: Partial<Observation>) {
  const body: Record<string, unknown> = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if (data.attributeId !== undefined) body.attributeId = data.attributeId || null;
  if (data.phenomenonId !== undefined) body.phenomenonId = data.phenomenonId || null;
  if (data.impact !== undefined) body.impact = data.impact;
  if (data.risk !== undefined) body.risk = data.risk;
  if (data.interpretation !== undefined) body.interpretation = data.interpretation;
  if (data.status !== undefined) body.status = data.status;

  if (data.createdBy !== undefined) {
    const createdById = toOptionalId(data.createdBy);
    body.createdById = createdById ?? null;
  }

  return body;
}

export async function getObservationsByProject(projectId: string): Promise<Observation[]> {
  const data = await request<ApiObservation[]>(`/projects/${projectId}/observations`);
  return data.map(mapObservation);
}

export async function getObservationById(id: string): Promise<Observation | null> {
  try {
    const data = await request<ApiObservation>(`/observations/${id}`);
    return mapObservation(data);
  } catch {
    return null;
  }
}

export async function createObservation(
  projectId: string,
  data: Omit<Observation, "id" | "projectId" | "createdAt" | "createdByName">,
): Promise<Observation> {
  const created = await request<ApiObservation>(`/projects/${projectId}/observations`, {
    method: "POST",
    json: buildCreateBody(data),
  });
  return mapObservation(created);
}

export async function updateObservation(
  id: string,
  data: Partial<Observation>,
): Promise<Observation | null> {
  try {
    const updated = await request<ApiObservation>(`/observations/${id}`, {
      method: "PUT",
      json: buildUpdateBody(data),
    });
    return mapObservation(updated);
  } catch {
    return null;
  }
}

export async function markObservationAsAnalyzed(id: string): Promise<Observation | null> {
  try {
    const updated = await request<ApiObservation>(`/observations/${id}/analyze`, {
      method: "PATCH",
    });
    return mapObservation(updated);
  } catch {
    return null;
  }
}

export async function deleteObservation(id: string): Promise<void> {
  await request<void>(`/observations/${id}`, { method: "DELETE" });
}

export async function linkObservationToDiscussion(
  observationId: string,
  discussionId: string,
): Promise<Observation | null> {
  void discussionId;
  return updateObservation(observationId, { status: "LINKED_TO_DISCUSSION" });
}
