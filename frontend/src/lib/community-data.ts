// UI types and label maps for the ObiOne "Comunidade Observacional" layer.
// (Legacy mock arrays were removed; data now comes from the backend with
// fallbacks in src/data/mockCommunity.ts.)

export type CommunityStatus = "ativa" | "monitorada" | "em-formação";

export type ParticipantRole = "admin" | "consultor" | "cliente";
export type ParticipantStatus = "ativo" | "convidado" | "aguardando-validação";
export type ParticipationType =
  | "Governança"
  | "Curadoria"
  | "Interpretação"
  | "Feedback"
  | "Validação"
  | "Acompanhamento";

export interface CommunityParticipant {
  id: string;
  name: string;
  role: ParticipantRole;
  domain?: string;
  project?: string;
  participation: ParticipationType;
  status: ParticipantStatus;
}

export type DiscussionStatus = "Aberta" | "Em análise" | "Revisada" | "Consolidada" | "Arquivada";
export type VisibilityScope =
  | "Comunidade do domínio"
  | "Participantes do projeto"
  | "Consultores vinculados"
  | "Administradores";

export type ContributionType =
  | "Evidência"
  | "Interpretação"
  | "Feedback"
  | "Hipótese"
  | "Validação"
  | "Contraponto";

export interface DiscussionContribution {
  id: string;
  participant: string;
  role: ParticipantRole;
  text: string;
  date: string;
  type: ContributionType;
}

export interface Discussion {
  id: string;
  title: string;
  domain: string;
  project?: string;
  phenomenon: string;
  originObservation: string;
  investigativeQuestion: string;
  contributionsList: DiscussionContribution[];
  contributions: number;
  lastParticipant: string;
  status: DiscussionStatus;
  visibility: VisibilityScope;
}

export type KnowledgeConfidence = "Baixo" | "Médio" | "Alto";
export type KnowledgeStatus = "Proposto" | "Em revisão" | "Consolidado";

export interface CommunityKnowledge {
  id: string;
  title: string;
  domain: string;
  project?: string;
  phenomenon: string;
  summary: string;
  evidences: string;
  recommendation: string;
  confidence: KnowledgeConfidence;
  status: KnowledgeStatus;
  originDiscussion: string;
}

export const communityStatusLabels: Record<CommunityStatus, string> = {
  ativa: "Ativa",
  monitorada: "Monitorada",
  "em-formação": "Em formação",
};

export const participantStatusLabels: Record<ParticipantStatus, string> = {
  ativo: "Ativo",
  convidado: "Convidado",
  "aguardando-validação": "Aguardando validação",
};

export const roleLabels: Record<ParticipantRole, string> = {
  admin: "Administrador",
  consultor: "Consultor",
  cliente: "Cliente",
};
