export type DomainTypeCode = "STRATEGIC" | "MANAGERIAL" | "HYBRID" | "ACADEMIC";
export type DomainStatusCode = "ACTIVE" | "MONITORED" | "IN_REVIEW" | "FORMING";

export interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: DomainTypeCode;
  observationObjective: string;
  priorityIndicators: string[];
  expectedPhenomena: string[];
  status: DomainStatusCode;
  projectCount: number;
  participantCount: number;
  discussionCount: number;
  knowledgeCount: number;
  phenomenonCount: number;
  engagementRate: number;
  createdAt: string;
}
