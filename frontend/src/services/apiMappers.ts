import type {
  Observation,
  ObservationImpact,
  ObservationOrigin,
  ObservationRisk,
  ObservationStatus,
} from "@/types/observation";
import type {
  ContributionType,
  Discussion,
  DiscussionContribution,
  DiscussionStatusCode,
  DiscussionVisibility,
} from "@/types/discussion";
import type {
  Phenomenon,
  PhenomenonImpact,
  PhenomenonStatus,
  PhenomenonTrend,
} from "@/types/phenomenon";
import type { Domain, DomainStatusCode, DomainTypeCode } from "@/types/domain";
import type {
  EngagementLevel,
  Project,
  ProjectStatusCode,
  ProjectTypeCode,
  RiskLevel,
} from "@/types/project";
import type { Profile } from "@/types/profile";
import type { Permission, ProfilePermission } from "@/types/permission";
import type {
  CommunityDiscussionSummary,
  CommunityKnowledgeSummary,
  CommunityOverview,
  CommunityOverviewResponse,
  CommunityParticipant,
  CommunityPhenomenonSummary,
  CommunityProjectSummary,
  DomainCommunityDetail,
  DomainCommunityStatusCode,
  DomainCommunitySummary,
} from "@/types/community";
import type { Knowledge, KnowledgeConfidenceCode, KnowledgeStatusCode } from "@/types/knowledge";
import type { ProfileCode, User, UserStatus } from "@/types/user";

/** Raw shapes returned by the Spring Boot API. */
export interface ApiProfile {
  id: number;
  code: ProfileCode;
  name: string;
  description: string;
}

export interface ApiPermission {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
}

export interface ApiProfilePermission {
  profileCode: ProfileCode;
  permissionCode: string;
  enabled: boolean;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  profileCode: ProfileCode;
  status: UserStatus;
  domainIds: string[];
  projectIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ApiCurrentUser {
  id: number;
  name: string;
  email: string;
  profileCode: ProfileCode;
  status: UserStatus;
}

export interface ApiLoginResponse {
  accessToken: string;
  tokenType: string;
  user: ApiCurrentUser;
}

export interface ApiDiscussionContribution {
  id: number;
  discussionId: number;
  userId: number | null;
  userName: string | null;
  type: ContributionType;
  text: string;
  createdAt: string;
}

export interface ApiDiscussion {
  id: number;
  domainId: number;
  projectId: number | null;
  phenomenonId: number | null;
  observationId: number | null;
  title: string;
  question: string;
  status: DiscussionStatusCode;
  visibility: DiscussionVisibility;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt?: string;
  contributions: ApiDiscussionContribution[];
}

export interface ApiPhenomenon {
  id: number;
  domainId: number;
  projectId: number | null;
  name: string;
  description: string | null;
  evidenceCount: number;
  relatedAttributeIds: string[];
  impact: PhenomenonImpact;
  trend: PhenomenonTrend;
  status: PhenomenonStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiObservation {
  id: number;
  projectId: number;
  title: string;
  description: string;
  attributeId: string | null;
  phenomenonId: string | null;
  impact: ObservationImpact;
  risk: ObservationRisk;
  interpretation: string | null;
  status: ObservationStatus;
  origin: ObservationOrigin | null;
  sourceExcerpt: string | null;
  suggestionId: number | null;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiProject {
  id: number;
  name: string;
  domainId: number;
  clientId: number | null;
  clientName: string | null;
  consultantId: number | null;
  consultantName: string | null;
  type: ProjectTypeCode;
  status: ProjectStatusCode;
  summary: string;
  observationObjective: string;
  initialAttributeIds: string[];
  expectedPhenomena: string[];
  progress: number;
  riskLevel: RiskLevel;
  clientEngagement: EngagementLevel;
  startDate: string | null;
  expectedEndDate: string | null;
  closureSummary?: string | null;
  lessonsLearned?: string | null;
  identifiedPatterns?: string | null;
  futureRecommendation?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiKnowledge {
  id: number;
  domainId: number;
  projectId: number | null;
  discussionId: number | null;
  phenomenonId: number | null;
  title: string;
  summary: string;
  evidence: string | null;
  recommendation: string | null;
  confidence: KnowledgeConfidenceCode;
  status: KnowledgeStatusCode;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiDomain {
  id: number;
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
  updatedAt?: string;
}

function formatCreatedAt(iso: string): string {
  return iso.slice(0, 10);
}

export function mapProfile(dto: ApiProfile): Profile {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name,
    description: dto.description,
  };
}

export function mapPermission(dto: ApiPermission): Permission {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name,
    description: dto.description,
    category: dto.category,
  };
}

export function mapProfilePermission(dto: ApiProfilePermission): ProfilePermission {
  return {
    profileCode: dto.profileCode,
    permissionCode: dto.permissionCode,
    enabled: dto.enabled,
  };
}

export function mapUser(dto: ApiUser): User {
  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email,
    profileCode: dto.profileCode,
    status: dto.status,
    domainIds: dto.domainIds ?? [],
    projectIds: dto.projectIds ?? [],
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapCurrentUser(dto: ApiCurrentUser): User {
  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email,
    profileCode: dto.profileCode,
    status: dto.status,
    domainIds: [],
    projectIds: [],
    createdAt: formatCreatedAt(new Date().toISOString()),
  };
}

export function mapDomain(dto: ApiDomain): Domain {
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.name,
    description: dto.description ?? "",
    type: dto.type,
    observationObjective: dto.observationObjective ?? "",
    priorityIndicators: dto.priorityIndicators ?? [],
    expectedPhenomena: dto.expectedPhenomena ?? [],
    status: dto.status,
    projectCount: dto.projectCount,
    participantCount: dto.participantCount,
    discussionCount: dto.discussionCount,
    knowledgeCount: dto.knowledgeCount,
    phenomenonCount: dto.phenomenonCount,
    engagementRate: dto.engagementRate,
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapDiscussionContribution(dto: ApiDiscussionContribution): DiscussionContribution {
  return {
    id: String(dto.id),
    discussionId: String(dto.discussionId),
    userId: dto.userId != null ? String(dto.userId) : "",
    userName: dto.userName ?? undefined,
    type: dto.type,
    text: dto.text,
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapDiscussion(dto: ApiDiscussion): Discussion {
  return {
    id: String(dto.id),
    domainId: String(dto.domainId),
    projectId: dto.projectId != null ? String(dto.projectId) : undefined,
    phenomenonId: dto.phenomenonId != null ? String(dto.phenomenonId) : undefined,
    observationId: dto.observationId != null ? String(dto.observationId) : undefined,
    title: dto.title,
    question: dto.question,
    status: dto.status,
    visibility: dto.visibility,
    contributions: (dto.contributions ?? []).map(mapDiscussionContribution),
    createdBy: dto.createdById != null ? String(dto.createdById) : "",
    createdByName: dto.createdByName ?? undefined,
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapPhenomenon(dto: ApiPhenomenon): Phenomenon {
  return {
    id: String(dto.id),
    domainId: String(dto.domainId),
    projectId: dto.projectId != null ? String(dto.projectId) : undefined,
    name: dto.name,
    description: dto.description ?? "",
    evidenceCount: dto.evidenceCount,
    relatedAttributeIds: dto.relatedAttributeIds ?? [],
    impact: dto.impact,
    trend: dto.trend,
    status: dto.status,
  };
}

export function mapObservation(dto: ApiObservation): Observation {
  return {
    id: String(dto.id),
    projectId: String(dto.projectId),
    title: dto.title,
    description: dto.description,
    attributeId: dto.attributeId ?? "",
    phenomenonId: dto.phenomenonId ?? undefined,
    impact: dto.impact,
    risk: dto.risk,
    interpretation: dto.interpretation ?? "",
    status: dto.status,
    origin: dto.origin ?? "MANUAL",
    sourceExcerpt: dto.sourceExcerpt ?? undefined,
    suggestionId: dto.suggestionId ?? undefined,
    createdBy: dto.createdById != null ? String(dto.createdById) : "",
    createdByName: dto.createdByName ?? undefined,
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapKnowledge(dto: ApiKnowledge): Knowledge {
  return {
    id: String(dto.id),
    domainId: String(dto.domainId),
    projectId: dto.projectId != null ? String(dto.projectId) : undefined,
    discussionId: dto.discussionId != null ? String(dto.discussionId) : undefined,
    phenomenonId: dto.phenomenonId != null ? String(dto.phenomenonId) : undefined,
    title: dto.title,
    summary: dto.summary,
    evidence: dto.evidence ?? "",
    recommendation: dto.recommendation ?? "",
    confidence: dto.confidence,
    status: dto.status,
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapProject(dto: ApiProject): Project {
  return {
    id: String(dto.id),
    name: dto.name,
    domainId: String(dto.domainId),
    clientId: dto.clientId != null ? String(dto.clientId) : "",
    clientName: dto.clientName ?? undefined,
    consultantId: dto.consultantId != null ? String(dto.consultantId) : "",
    consultantName: dto.consultantName ?? undefined,
    type: dto.type,
    status: dto.status,
    summary: dto.summary ?? "",
    observationObjective: dto.observationObjective ?? "",
    initialAttributeIds: dto.initialAttributeIds ?? [],
    expectedPhenomena: dto.expectedPhenomena ?? [],
    progress: dto.progress,
    riskLevel: dto.riskLevel,
    clientEngagement: dto.clientEngagement,
    startDate: dto.startDate ?? "",
    expectedEndDate: dto.expectedEndDate ?? "",
    createdAt: formatCreatedAt(dto.createdAt),
    updatedAt: formatCreatedAt(dto.updatedAt ?? dto.createdAt),
  };
}

export interface ApiCommunityParticipant {
  id: number;
  name: string;
  email: string;
  profileCode: ProfileCode;
  roleDescription: string;
  domainIds: string[];
  projectIds: string[];
}

export interface ApiCommunityProject {
  id: number;
  name: string;
  status: ProjectStatusCode;
  riskLevel: RiskLevel;
  progress: number;
  clientName: string | null;
  consultantName: string | null;
}

export interface ApiCommunityDiscussion {
  id: number;
  domainId: number;
  domainSlug: string;
  domainName: string;
  title: string;
  question: string;
  status: DiscussionStatusCode;
  visibility: DiscussionVisibility;
  projectId: number | null;
  projectName: string | null;
  phenomenonId: number | null;
  phenomenonName: string | null;
  contributionsCount: number;
  createdAt: string;
}

export interface ApiCommunityKnowledge {
  id: number;
  domainId: number;
  domainSlug: string;
  domainName: string;
  title: string;
  summary: string;
  recommendation: string | null;
  confidence: KnowledgeConfidenceCode;
  status: KnowledgeStatusCode;
  projectId: number | null;
  projectName: string | null;
  phenomenonId: number | null;
  phenomenonName: string | null;
  createdAt: string;
}

export interface ApiCommunityPhenomenon {
  id: number;
  name: string;
  description: string | null;
  status: PhenomenonStatus;
  trend: PhenomenonTrend;
  impact: PhenomenonImpact;
  evidenceCount: number;
}

export interface ApiDomainCommunity {
  domainId: number;
  domainSlug: string;
  domainName: string;
  description: string | null;
  status: DomainStatusCode;
  participantCount: number;
  projectCount: number;
  discussionCount: number;
  knowledgeCount: number;
  phenomenonCount: number;
  contributionCount: number;
  participants: ApiCommunityParticipant[];
  projects: ApiCommunityProject[];
  discussions: ApiCommunityDiscussion[];
  knowledge: ApiCommunityKnowledge[];
  topPhenomena: ApiCommunityPhenomenon[];
}

export interface ApiCommunityOverview {
  totalDomains: number;
  totalParticipants: number;
  totalDiscussions: number;
  totalKnowledge: number;
  totalContributions: number;
  activeCommunities: number;
  domainCommunities: ApiDomainCommunity[];
  recentDiscussions: ApiCommunityDiscussion[];
  recentKnowledge: ApiCommunityKnowledge[];
}

const domainCommunityStatusMap: Record<string, DomainCommunityStatusCode> = {
  ACTIVE: "ACTIVE",
  MONITORED: "MONITORED",
  FORMING: "FORMING",
  IN_REVIEW: "MONITORED",
};

const participationByProfile: Record<ProfileCode, string> = {
  ADMIN: "Governança",
  CONSULTANT: "Interpretação",
  CLIENT: "Feedback",
};

export function mapCommunityParticipant(
  dto: ApiCommunityParticipant,
  domainId: string,
): CommunityParticipant {
  return {
    id: String(dto.id),
    userId: String(dto.id),
    domainId,
    name: dto.name,
    role: dto.profileCode,
    participation: participationByProfile[dto.profileCode] ?? dto.roleDescription,
    status: "ACTIVE",
  };
}

export function mapCommunityParticipantToLegacyTable(
  dto: ApiCommunityParticipant,
  domainName: string,
): import("@/lib/community-data").CommunityParticipant {
  const roleMap = {
    ADMIN: "admin",
    CONSULTANT: "consultor",
    CLIENT: "cliente",
  } as const;

  return {
    id: String(dto.id),
    name: dto.name,
    role: roleMap[dto.profileCode],
    domain: domainName,
    participation: (participationByProfile[dto.profileCode] ??
      "Acompanhamento") as import("@/lib/community-data").ParticipationType,
    status: "ativo",
  };
}

function mapDomainCommunityStatus(status: string): DomainCommunityStatusCode {
  return domainCommunityStatusMap[status] ?? "ACTIVE";
}

export function mapDomainCommunitySummary(dto: ApiDomainCommunity): DomainCommunitySummary {
  const domainId = String(dto.domainId);
  return {
    id: domainId,
    domainId,
    domainSlug: dto.domainSlug,
    domainName: dto.domainName,
    description: dto.description ?? "",
    participants: dto.participantCount,
    linkedProjects: dto.projectCount,
    discussions: dto.discussionCount,
    insights: dto.knowledgeCount,
    status: mapDomainCommunityStatus(dto.status),
  };
}

export function mapCommunityProject(dto: ApiCommunityProject): CommunityProjectSummary {
  return {
    id: String(dto.id),
    name: dto.name,
    status: dto.status,
    riskLevel: dto.riskLevel,
    progress: dto.progress,
    clientName: dto.clientName ?? undefined,
    consultantName: dto.consultantName ?? undefined,
  };
}

export function mapCommunityDiscussion(dto: ApiCommunityDiscussion): CommunityDiscussionSummary {
  return {
    id: String(dto.id),
    domainId: String(dto.domainId),
    domainSlug: dto.domainSlug,
    domainName: dto.domainName,
    title: dto.title,
    question: dto.question,
    status: dto.status,
    visibility: dto.visibility,
    projectId: dto.projectId != null ? String(dto.projectId) : undefined,
    projectName: dto.projectName ?? undefined,
    phenomenonId: dto.phenomenonId != null ? String(dto.phenomenonId) : undefined,
    phenomenonName: dto.phenomenonName ?? undefined,
    contributionsCount: dto.contributionsCount,
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapCommunityKnowledge(dto: ApiCommunityKnowledge): CommunityKnowledgeSummary {
  return {
    id: String(dto.id),
    domainId: String(dto.domainId),
    domainSlug: dto.domainSlug,
    domainName: dto.domainName,
    title: dto.title,
    summary: dto.summary,
    recommendation: dto.recommendation ?? "",
    confidence: dto.confidence,
    status: dto.status,
    projectId: dto.projectId != null ? String(dto.projectId) : undefined,
    projectName: dto.projectName ?? undefined,
    phenomenonId: dto.phenomenonId != null ? String(dto.phenomenonId) : undefined,
    phenomenonName: dto.phenomenonName ?? undefined,
    createdAt: formatCreatedAt(dto.createdAt),
  };
}

export function mapCommunityPhenomenon(dto: ApiCommunityPhenomenon): CommunityPhenomenonSummary {
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description ?? "",
    status: dto.status,
    trend: dto.trend,
    impact: dto.impact,
    evidenceCount: dto.evidenceCount,
  };
}

export function mapDomainCommunityDetail(dto: ApiDomainCommunity): DomainCommunityDetail {
  const summary = mapDomainCommunitySummary(dto);
  const domainId = summary.domainId;

  return {
    ...summary,
    phenomenonCount: dto.phenomenonCount,
    contributionCount: dto.contributionCount,
    participantsList: (dto.participants ?? []).map((p) => mapCommunityParticipant(p, domainId)),
    projects: (dto.projects ?? []).map(mapCommunityProject),
    discussions: (dto.discussions ?? []).map(mapCommunityDiscussion),
    knowledge: (dto.knowledge ?? []).map(mapCommunityKnowledge),
    topPhenomena: (dto.topPhenomena ?? []).map(mapCommunityPhenomenon),
  };
}

export function mapCommunityOverview(dto: ApiCommunityOverview): CommunityOverviewResponse {
  const overview: CommunityOverview = {
    activeCommunities: dto.activeCommunities,
    authorizedParticipants: dto.totalParticipants,
    observationalDiscussions: dto.totalDiscussions,
    collaborativeInsights: dto.totalKnowledge,
    recentContributions: dto.totalContributions,
  };

  return {
    overview,
    domains: (dto.domainCommunities ?? []).map(mapDomainCommunitySummary),
    recentDiscussions: (dto.recentDiscussions ?? []).map(mapCommunityDiscussion),
    recentKnowledge: (dto.recentKnowledge ?? []).map(mapCommunityKnowledge),
  };
}
