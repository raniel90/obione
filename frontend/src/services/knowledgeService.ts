import type {
  Knowledge,
  KnowledgeConfidenceCode,
  KnowledgeStatusCode,
} from "@/types/knowledge";
import type {
  CommunityKnowledge,
  KnowledgeConfidence,
  KnowledgeStatus,
} from "@/lib/community-data";
import { request } from "./apiClient";
import { type ApiKnowledge, mapKnowledge } from "./apiMappers";

function toOptionalId(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const confidenceLabels: Record<KnowledgeConfidenceCode, KnowledgeConfidence> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};

const statusLabels: Record<KnowledgeStatusCode, KnowledgeStatus> = {
  PROPOSED: "Proposto",
  IN_REVIEW: "Em revisão",
  CONSOLIDATED: "Consolidado",
};

function buildCreateBody(data: Omit<Knowledge, "id" | "createdAt">) {
  const body: Record<string, unknown> = {
    title: data.title,
    summary: data.summary,
    domainId: Number(data.domainId),
  };

  const projectId = toOptionalId(data.projectId);
  const discussionId = toOptionalId(data.discussionId);
  const phenomenonId = toOptionalId(data.phenomenonId);

  if (projectId !== undefined) body.projectId = projectId;
  if (discussionId !== undefined) body.discussionId = discussionId;
  if (phenomenonId !== undefined) body.phenomenonId = phenomenonId;
  if (data.evidence) body.evidence = data.evidence;
  if (data.recommendation) body.recommendation = data.recommendation;
  if (data.confidence) body.confidence = data.confidence;
  if (data.status) body.status = data.status;

  return body;
}

export interface ConsolidateKnowledgeInput {
  title: string;
  summary: string;
  evidence?: string;
  recommendation?: string;
  confidence?: KnowledgeConfidenceCode;
}

function buildConsolidateBody(data: ConsolidateKnowledgeInput) {
  const body: Record<string, unknown> = {
    title: data.title,
    summary: data.summary,
  };

  if (data.evidence) body.evidence = data.evidence;
  if (data.recommendation) body.recommendation = data.recommendation;
  if (data.confidence) body.confidence = data.confidence;

  return body;
}

export function toCommunityKnowledge(
  knowledge: Knowledge,
  names: {
    domain: string;
    project?: string;
    phenomenon?: string;
  },
): CommunityKnowledge {
  return {
    id: knowledge.id,
    title: knowledge.title,
    domain: names.domain,
    project: names.project,
    phenomenon: names.phenomenon ?? "—",
    summary: knowledge.summary,
    evidences: knowledge.evidence,
    recommendation: knowledge.recommendation,
    confidence: confidenceLabels[knowledge.confidence],
    status: statusLabels[knowledge.status],
    originDiscussion: knowledge.discussionId ?? "",
  };
}

export async function getKnowledge(): Promise<Knowledge[]> {
  const data = await request<ApiKnowledge[]>("/knowledge");
  return data.map(mapKnowledge);
}

export async function getKnowledgeById(id: string): Promise<Knowledge | null> {
  try {
    const data = await request<ApiKnowledge>(`/knowledge/${id}`);
    return mapKnowledge(data);
  } catch {
    return null;
  }
}

export async function getKnowledgeByDomain(domainId: string): Promise<Knowledge[]> {
  const data = await request<ApiKnowledge[]>(`/domains/${domainId}/knowledge`);
  return data.map(mapKnowledge);
}

export async function getKnowledgeByProject(projectId: string): Promise<Knowledge[]> {
  const data = await request<ApiKnowledge[]>(`/projects/${projectId}/knowledge`);
  return data.map(mapKnowledge);
}

export async function getKnowledgeByDiscussion(discussionId: string): Promise<Knowledge[]> {
  const data = await request<ApiKnowledge[]>(`/discussions/${discussionId}/knowledge`);
  return data.map(mapKnowledge);
}

export async function createKnowledge(
  data: Omit<Knowledge, "id" | "createdAt">,
): Promise<Knowledge> {
  const created = await request<ApiKnowledge>("/knowledge", {
    method: "POST",
    json: buildCreateBody(data),
  });
  return mapKnowledge(created);
}

export async function consolidateKnowledge(
  discussionId: string,
  data: ConsolidateKnowledgeInput,
): Promise<Knowledge> {
  const created = await request<ApiKnowledge>(`/discussions/${discussionId}/consolidate`, {
    method: "POST",
    json: buildConsolidateBody(data),
  });
  return mapKnowledge(created);
}
