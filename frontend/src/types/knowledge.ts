export type KnowledgeConfidenceCode = "LOW" | "MEDIUM" | "HIGH";
export type KnowledgeStatusCode = "PROPOSED" | "IN_REVIEW" | "CONSOLIDATED";

export interface Knowledge {
  id: string;
  domainId: string;
  projectId?: string;
  discussionId?: string;
  phenomenonId?: string;
  title: string;
  summary: string;
  evidence: string;
  recommendation: string;
  confidence: KnowledgeConfidenceCode;
  status: KnowledgeStatusCode;
  createdAt: string;
}
