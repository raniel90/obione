import type { DiscussionStatusCode, DiscussionVisibility } from "@/types/discussion";
import type { KnowledgeConfidenceCode, KnowledgeStatusCode } from "@/types/knowledge";
import type { PhenomenonImpact, PhenomenonStatus, PhenomenonTrend } from "@/types/phenomenon";
import type { ProjectStatusCode, RiskLevel } from "@/types/project";

export interface CommunityOverview {
  activeCommunities: number;
  authorizedParticipants: number;
  observationalDiscussions: number;
  collaborativeInsights: number;
  recentContributions: number;
}

export type DomainCommunityStatusCode = "ACTIVE" | "MONITORED" | "FORMING";

export interface DomainCommunitySummary {
  id: string;
  domainId: string;
  domainSlug: string;
  domainName: string;
  description: string;
  participants: number;
  linkedProjects: number;
  discussions: number;
  insights: number;
  status: DomainCommunityStatusCode;
}

export interface CommunityParticipant {
  id: string;
  userId: string;
  domainId: string;
  name: string;
  role: "ADMIN" | "CONSULTANT" | "CLIENT";
  participation: string;
  status: "ACTIVE" | "INVITED" | "PENDING";
}

export interface CommunityProjectSummary {
  id: string;
  name: string;
  status: ProjectStatusCode;
  riskLevel: RiskLevel;
  progress: number;
  clientName?: string;
  consultantName?: string;
}

export interface CommunityDiscussionSummary {
  id: string;
  domainId: string;
  domainSlug: string;
  domainName: string;
  title: string;
  question: string;
  status: DiscussionStatusCode;
  visibility: DiscussionVisibility;
  projectId?: string;
  projectName?: string;
  phenomenonId?: string;
  phenomenonName?: string;
  contributionsCount: number;
  createdAt: string;
}

export interface CommunityKnowledgeSummary {
  id: string;
  domainId: string;
  domainSlug: string;
  domainName: string;
  title: string;
  summary: string;
  recommendation: string;
  confidence: KnowledgeConfidenceCode;
  status: KnowledgeStatusCode;
  projectId?: string;
  projectName?: string;
  phenomenonId?: string;
  phenomenonName?: string;
  createdAt: string;
}

export interface CommunityPhenomenonSummary {
  id: string;
  name: string;
  description: string;
  status: PhenomenonStatus;
  trend: PhenomenonTrend;
  impact: PhenomenonImpact;
  evidenceCount: number;
}

export interface DomainCommunityDetail extends DomainCommunitySummary {
  phenomenonCount: number;
  contributionCount: number;
  participantsList: CommunityParticipant[];
  projects: CommunityProjectSummary[];
  discussions: CommunityDiscussionSummary[];
  knowledge: CommunityKnowledgeSummary[];
  topPhenomena: CommunityPhenomenonSummary[];
}

export interface CommunityOverviewResponse {
  overview: CommunityOverview;
  domains: DomainCommunitySummary[];
  recentDiscussions: CommunityDiscussionSummary[];
  recentKnowledge: CommunityKnowledgeSummary[];
}
