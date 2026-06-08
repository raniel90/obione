import type {
  ContributionType as CommunityContributionType,
  Discussion as CommunityDiscussion,
  DiscussionContribution as CommunityContribution,
  DiscussionStatus,
  ParticipantRole,
  VisibilityScope,
} from "@/lib/community-data";
import type {
  ContributionType,
  Discussion,
  DiscussionContribution,
  DiscussionStatusCode,
  DiscussionVisibility,
} from "@/types/discussion";
import { request } from "./apiClient";
import {
  type ApiDiscussion,
  type ApiDiscussionContribution,
  mapDiscussion,
  mapDiscussionContribution,
} from "./apiMappers";

const statusLabels: Record<DiscussionStatusCode, DiscussionStatus> = {
  OPEN: "Aberta",
  IN_ANALYSIS: "Em análise",
  REVIEWED: "Revisada",
  CONSOLIDATED: "Consolidada",
  ARCHIVED: "Arquivada",
};

export const statusCodes: Record<DiscussionStatus, DiscussionStatusCode> = {
  Aberta: "OPEN",
  "Em análise": "IN_ANALYSIS",
  Revisada: "REVIEWED",
  Consolidada: "CONSOLIDATED",
  Arquivada: "ARCHIVED",
};

const visibilityLabels: Record<DiscussionVisibility, VisibilityScope> = {
  DOMAIN: "Comunidade do domínio",
  PROJECT: "Participantes do projeto",
  CONSULTANTS: "Consultores vinculados",
  ADMINS: "Administradores",
};

export const visibilityCodes: Record<VisibilityScope, DiscussionVisibility> = {
  "Comunidade do domínio": "DOMAIN",
  "Participantes do projeto": "PROJECT",
  "Consultores vinculados": "CONSULTANTS",
  Administradores: "ADMINS",
};

const contributionTypeLabels: Record<ContributionType, CommunityContributionType> = {
  EVIDENCE: "Evidência",
  INTERPRETATION: "Interpretação",
  FEEDBACK: "Feedback",
  HYPOTHESIS: "Hipótese",
  VALIDATION: "Validação",
  COUNTERPOINT: "Contraponto",
};

export const contributionTypeCodes: Record<CommunityContributionType, ContributionType> = {
  Evidência: "EVIDENCE",
  Interpretação: "INTERPRETATION",
  Feedback: "FEEDBACK",
  Hipótese: "HYPOTHESIS",
  Validação: "VALIDATION",
  Contraponto: "COUNTERPOINT",
};

function toCommunityContribution(contribution: DiscussionContribution): CommunityContribution {
  return {
    id: contribution.id,
    participant: contribution.userName ?? "Participante",
    role: "consultor" as ParticipantRole,
    text: contribution.text,
    date: contribution.createdAt,
    type: contributionTypeLabels[contribution.type],
  };
}

export function toCommunityDiscussion(
  discussion: Discussion,
  names: {
    domain: string;
    project?: string;
    phenomenon?: string;
    originObservation?: string;
  },
): CommunityDiscussion {
  const contributions = discussion.contributions ?? [];
  const contributionsList = contributions.map(toCommunityContribution);
  const lastContribution = contributions[contributions.length - 1];

  return {
    id: discussion.id,
    title: discussion.title,
    domain: names.domain,
    project: names.project,
    phenomenon: names.phenomenon ?? "—",
    originObservation:
      names.originObservation ??
      (discussion.observationId ? `Observação #${discussion.observationId}` : "—"),
    investigativeQuestion: discussion.question,
    contributionsList,
    contributions: contributions.length,
    lastParticipant:
      lastContribution?.userName ?? discussion.createdByName ?? discussion.createdBy ?? "—",
    status: statusLabels[discussion.status],
    visibility: visibilityLabels[discussion.visibility],
  };
}

function toOptionalId(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCreateBody(
  data: Omit<Discussion, "id" | "createdAt" | "contributions" | "createdByName">,
) {
  const body: Record<string, unknown> = {
    title: data.title,
    question: data.question,
    domainId: Number(data.domainId),
    status: data.status,
    visibility: data.visibility,
  };

  const projectId = toOptionalId(data.projectId);
  const phenomenonId = toOptionalId(data.phenomenonId);
  const observationId = toOptionalId(data.observationId);
  const createdById = toOptionalId(data.createdBy);

  if (projectId !== undefined) body.projectId = projectId;
  if (phenomenonId !== undefined) body.phenomenonId = phenomenonId;
  if (observationId !== undefined) body.observationId = observationId;
  if (createdById !== undefined) body.createdById = createdById;

  return body;
}

function buildContributionBody(
  data: Omit<DiscussionContribution, "id" | "discussionId" | "createdAt" | "userName">,
) {
  const body: Record<string, unknown> = {
    type: data.type,
    text: data.text,
  };

  const userId = toOptionalId(data.userId);
  if (userId !== undefined) body.userId = userId;

  return body;
}

export async function getDiscussions(): Promise<Discussion[]> {
  const data = await request<ApiDiscussion[]>("/discussions");
  return data.map(mapDiscussion);
}

export async function getDiscussionById(id: string): Promise<Discussion | null> {
  try {
    const data = await request<ApiDiscussion>(`/discussions/${id}`);
    return mapDiscussion(data);
  } catch {
    return null;
  }
}

export async function getDiscussionsByDomain(domainId: string): Promise<Discussion[]> {
  const data = await request<ApiDiscussion[]>(`/domains/${domainId}/discussions`);
  return data.map(mapDiscussion);
}

export async function getDiscussionsByProject(projectId: string): Promise<Discussion[]> {
  const data = await request<ApiDiscussion[]>(`/projects/${projectId}/discussions`);
  return data.map(mapDiscussion);
}

export async function createDiscussion(
  data: Omit<Discussion, "id" | "createdAt" | "contributions" | "createdByName">,
): Promise<Discussion> {
  const created = await request<ApiDiscussion>("/discussions", {
    method: "POST",
    json: buildCreateBody(data),
  });
  return mapDiscussion(created);
}

export async function addContribution(
  discussionId: string,
  data: Omit<DiscussionContribution, "id" | "discussionId" | "createdAt" | "userName">,
): Promise<DiscussionContribution | null> {
  try {
    const created = await request<ApiDiscussionContribution>(
      `/discussions/${discussionId}/contributions`,
      {
        method: "POST",
        json: buildContributionBody(data),
      },
    );
    return mapDiscussionContribution(created);
  } catch {
    return null;
  }
}

export async function updateDiscussionStatus(
  id: string,
  status: DiscussionStatusCode,
): Promise<Discussion | null> {
  try {
    const updated = await request<ApiDiscussion>(`/discussions/${id}/status`, {
      method: "PATCH",
      json: { status },
    });
    return mapDiscussion(updated);
  } catch {
    return null;
  }
}

export async function archiveDiscussion(id: string): Promise<Discussion | null> {
  try {
    const updated = await request<ApiDiscussion>(`/discussions/${id}/archive`, {
      method: "POST",
    });
    return mapDiscussion(updated);
  } catch {
    return null;
  }
}
