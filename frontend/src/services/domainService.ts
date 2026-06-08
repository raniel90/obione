import type { Domain } from "@/types/domain";
import { request } from "./apiClient";
import { type ApiDomain, mapDomain } from "./apiMappers";

export async function getDomains(): Promise<Domain[]> {
  const data = await request<ApiDomain[]>("/domains");
  return data.map(mapDomain);
}

export async function getDomainById(id: string): Promise<Domain | null> {
  try {
    const data = await request<ApiDomain>(`/domains/${id}`);
    return mapDomain(data);
  } catch {
    return null;
  }
}

export async function getDomainBySlug(slug: string): Promise<Domain | null> {
  try {
    const data = await request<ApiDomain>(`/domains/slug/${slug}`);
    return mapDomain(data);
  } catch {
    return null;
  }
}

export async function createDomain(data: Omit<Domain, "id" | "createdAt">): Promise<Domain> {
  const created = await request<ApiDomain>("/domains", {
    method: "POST",
    json: {
      name: data.name,
      type: data.type,
      description: data.description,
      observationObjective: data.observationObjective,
      priorityIndicators: data.priorityIndicators ?? [],
      expectedPhenomena: data.expectedPhenomena ?? [],
      status: data.status ?? "ACTIVE",
      projectCount: data.projectCount ?? 0,
      participantCount: data.participantCount ?? 0,
      discussionCount: data.discussionCount ?? 0,
      knowledgeCount: data.knowledgeCount ?? 0,
      phenomenonCount: data.phenomenonCount ?? 0,
      engagementRate: data.engagementRate ?? 0,
    },
  });
  return mapDomain(created);
}

export async function updateDomain(id: string, data: Partial<Domain>): Promise<Domain | null> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.description !== undefined) body.description = data.description;
  if (data.type !== undefined) body.type = data.type;
  if (data.observationObjective !== undefined) body.observationObjective = data.observationObjective;
  if (data.priorityIndicators !== undefined) body.priorityIndicators = data.priorityIndicators;
  if (data.expectedPhenomena !== undefined) body.expectedPhenomena = data.expectedPhenomena;
  if (data.status !== undefined) body.status = data.status;
  if (data.projectCount !== undefined) body.projectCount = data.projectCount;
  if (data.participantCount !== undefined) body.participantCount = data.participantCount;
  if (data.discussionCount !== undefined) body.discussionCount = data.discussionCount;
  if (data.knowledgeCount !== undefined) body.knowledgeCount = data.knowledgeCount;
  if (data.phenomenonCount !== undefined) body.phenomenonCount = data.phenomenonCount;
  if (data.engagementRate !== undefined) body.engagementRate = data.engagementRate;

  try {
    const updated = await request<ApiDomain>(`/domains/${id}`, {
      method: "PUT",
      json: body,
    });
    return mapDomain(updated);
  } catch {
    return null;
  }
}

export async function getDomainStats(id: string): Promise<{
  projectCount: number;
  participantCount: number;
  discussionCount: number;
  knowledgeCount: number;
  phenomenonCount: number;
  engagementRate: number;
} | null> {
  const domain = await getDomainById(id);
  if (!domain) return null;
  return {
    projectCount: domain.projectCount,
    participantCount: domain.participantCount,
    discussionCount: domain.discussionCount,
    knowledgeCount: domain.knowledgeCount,
    phenomenonCount: domain.phenomenonCount,
    engagementRate: domain.engagementRate,
  };
}
