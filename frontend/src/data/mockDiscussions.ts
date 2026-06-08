import type {
  Discussion,
  DiscussionStatusCode,
  DiscussionVisibility,
  ContributionType,
} from "@/types/discussion";
import { discussions as legacyDiscussions } from "@/lib/community-data";
import { mockDomains } from "./mockDomains";

const statusMap: Record<string, DiscussionStatusCode> = {
  Aberta: "OPEN",
  "Em análise": "IN_ANALYSIS",
  Revisada: "REVIEWED",
  Consolidada: "CONSOLIDATED",
  Arquivada: "ARCHIVED",
};

const visMap: Record<string, DiscussionVisibility> = {
  "Comunidade do domínio": "DOMAIN",
  "Participantes do projeto": "PROJECT",
  "Consultores vinculados": "CONSULTANTS",
  Administradores: "ADMINS",
};

const contribMap: Record<string, ContributionType> = {
  Evidência: "EVIDENCE",
  Interpretação: "INTERPRETATION",
  Feedback: "FEEDBACK",
  Hipótese: "HYPOTHESIS",
  Validação: "VALIDATION",
  Contraponto: "COUNTERPOINT",
};

export const mockDiscussions: Discussion[] = legacyDiscussions.map((d) => {
  const domain = mockDomains.find((x) => x.name === d.domain);
  return {
    id: d.id,
    domainId: domain?.id ?? "",
    projectId: undefined,
    phenomenonId: undefined,
    observationId: undefined,
    title: d.title,
    question: d.investigativeQuestion,
    status: statusMap[d.status] ?? "OPEN",
    visibility: visMap[d.visibility] ?? "DOMAIN",
    createdBy: d.lastParticipant,
    createdAt: "2026-04-15",
    contributions: d.contributionsList.map((c) => ({
      id: c.id,
      discussionId: d.id,
      userId: c.participant,
      type: contribMap[c.type] ?? "INTERPRETATION",
      text: c.text,
      createdAt: c.date,
    })),
  };
});
