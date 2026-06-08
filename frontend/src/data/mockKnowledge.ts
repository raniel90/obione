import type { Knowledge, KnowledgeConfidenceCode, KnowledgeStatusCode } from "@/types/knowledge";
import { communityKnowledge } from "@/lib/community-data";
import { mockDomains } from "./mockDomains";

const confMap: Record<string, KnowledgeConfidenceCode> = {
  Baixo: "LOW",
  Médio: "MEDIUM",
  Alto: "HIGH",
};

const statusMap: Record<string, KnowledgeStatusCode> = {
  Proposto: "PROPOSED",
  "Em revisão": "IN_REVIEW",
  Consolidado: "CONSOLIDATED",
};

export const mockKnowledge: Knowledge[] = communityKnowledge.map((k) => {
  const domain = mockDomains.find((x) => x.name === k.domain);
  return {
    id: k.id,
    domainId: domain?.id ?? "",
    projectId: undefined,
    discussionId: k.originDiscussion,
    phenomenonId: undefined,
    title: k.title,
    summary: k.summary,
    evidence: k.evidences,
    recommendation: k.recommendation,
    confidence: confMap[k.confidence] ?? "MEDIUM",
    status: statusMap[k.status] ?? "PROPOSED",
    createdAt: "2026-04-30",
  };
});
