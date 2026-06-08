// Mock observatory data per project. Falls back to a generated baseline
// when a specific project id is not pre-defined here.

export type Trend = "up" | "down" | "stable";
export type ArtifactStatus = "pendente" | "analisado" | "revisado";
export type DiscussionStatus = "aberta" | "em análise" | "consolidada";
export type InsightStatus = "proposto" | "em revisão" | "consolidado";
export type InsightOrigin = "observatório" | "comunidade" | "artefatos";
export type InsightConfidence = "baixo" | "médio" | "alto";
export type TimelineType =
  | "cadastro"
  | "briefing"
  | "artefato"
  | "escopo"
  | "discussão"
  | "insight"
  | "risco";

export interface ProjectKpi {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "success" | "danger" | "info";
}

export interface ProjectPhenomenon {
  id: string;
  title: string;
  evidence: string;
  impact: string;
  trend: Trend;
  status: "Em observação" | "Consolidado" | "Atenção";
}

export interface ProjectArtifact {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  owner: string;
  status: ArtifactStatus;
}

export type ObservationStatus =
  | "registrada"
  | "em análise"
  | "associada a discussão"
  | "consolidada";

export type ObservationImpact = "Baixo" | "Médio" | "Alto";
export type ObservationRisk = "Baixo" | "Moderado" | "Elevado" | "Crítico";

export interface ProjectObservation {
  id: string;
  title: string;
  date: string;
  description: string;
  attribute: string;
  phenomenon: string;
  impact: ObservationImpact;
  risk: ObservationRisk;
  interpretation: string;
  author: string;
  status: ObservationStatus;
}

export interface ProjectParticipant {
  name: string;
  role: "Consultor" | "Cliente" | "Administrador";
  responsibility: string;
}

export interface ProjectDiscussion {
  id: string;
  question: string;
  contributions: number;
  status: DiscussionStatus;
}

export interface ProjectInsight {
  id: string;
  narrative: string;
  origin: InsightOrigin;
  confidence: InsightConfidence;
  status: InsightStatus;
}

export interface ProjectTimelineEvent {
  id: string;
  date: string;
  type: TimelineType;
  description: string;
  actor: string;
}

export interface ProjectObservatory {
  client: string;
  consultant: string;
  startDate: string;
  dueDate: string;
  summary: string; // resumo observacional
  kpis: ProjectKpi[];
  generalAttrs: { label: string; value: string }[];
  specificAttrs: { label: string; value: string }[];
  intermediateAttrs: {
    label: string;
    value: string;
    tone?: "warning" | "success" | "danger" | "info";
  }[];
  phenomena: ProjectPhenomenon[];
  artifacts: ProjectArtifact[];
  observations: ProjectObservation[];
  participants: ProjectParticipant[];
  discussions: ProjectDiscussion[];
  insights: ProjectInsight[];
  timeline: ProjectTimelineEvent[];
  domainContext: string;
}

const base: ProjectObservatory = {
  client: "Athos Capital",
  consultant: "Lucas Martins",
  startDate: "2026-02-10",
  dueDate: "2026-07-30",
  summary:
    "Este projeto apresenta risco moderado de atraso devido a mudanças recorrentes de escopo, validações tardias e baixa participação do cliente nos ciclos iniciais. O observatório recomenda intensificar rituais de alinhamento.",
  kpis: [
    { label: "Risco observado", value: "Moderado", tone: "warning" },
    { label: "Engajamento do cliente", value: "62%", tone: "info" },
    { label: "Transparência", value: "Alta", tone: "success" },
    { label: "Mudanças de escopo", value: "8", tone: "warning" },
    { label: "Maturidade observacional", value: "74%", tone: "success" },
    { label: "Tendência de atraso", value: "Crescente", tone: "danger" },
  ],
  generalAttrs: [
    { label: "Objetivo", value: "Reposicionar a marca para audiência B2B premium" },
    { label: "Metodologia", value: "Estratégia híbrida observacional" },
    { label: "Duração prevista", value: "5 meses" },
    { label: "Responsável", value: "Lucas Martins" },
  ],
  specificAttrs: [
    { label: "Mudanças de escopo", value: "8 registradas" },
    { label: "Atrasos de aprovação", value: "3 ciclos" },
    { label: "Artefatos reabertos", value: "2 documentos" },
    { label: "Feedbacks pendentes", value: "5 do cliente" },
    { label: "Riscos críticos", value: "1 registrado" },
  ],
  intermediateAttrs: [
    { label: "Nível de risco", value: "Moderado", tone: "warning" },
    { label: "Grau de engajamento", value: "62%", tone: "info" },
    { label: "Índice de colaboração", value: "Médio" },
    { label: "Tendência de atraso", value: "Crescente", tone: "danger" },
    { label: "Maturidade observacional", value: "74%", tone: "success" },
    { label: "Transparência", value: "Alta", tone: "success" },
  ],
  phenomena: [
    {
      id: "ph1",
      title: "Mudanças recorrentes de escopo",
      evidence: "8 alterações registradas após a fase inicial",
      impact: "Aumento do risco de retrabalho criativo",
      trend: "up",
      status: "Em observação",
    },
    {
      id: "ph2",
      title: "Baixa participação do cliente",
      evidence: "Atraso médio de 5 dias nas validações",
      impact: "Risco de atraso na entrega final",
      trend: "stable",
      status: "Atenção",
    },
    {
      id: "ph3",
      title: "Concentração de decisões em poucos atores",
      evidence: "92% das validações por um único stakeholder",
      impact: "Gargalo decisório nas fases críticas",
      trend: "up",
      status: "Em observação",
    },
  ],
  artifacts: [
    {
      id: "a1",
      name: "Briefing inicial",
      type: "Briefing",
      uploadedAt: "2026-02-12",
      owner: "Cliente Athos",
      status: "analisado",
    },
    {
      id: "a2",
      name: "Proposta comercial",
      type: "Proposta",
      uploadedAt: "2026-02-14",
      owner: "Lucas Martins",
      status: "revisado",
    },
    {
      id: "a3",
      name: "Cronograma estratégico",
      type: "Cronograma",
      uploadedAt: "2026-02-20",
      owner: "Lucas Martins",
      status: "analisado",
    },
    {
      id: "a4",
      name: "Ata reunião kickoff",
      type: "Ata",
      uploadedAt: "2026-02-22",
      owner: "Ana Coelho",
      status: "analisado",
    },
    {
      id: "a5",
      name: "Relatório de pesquisa de mercado",
      type: "Relatório",
      uploadedAt: "2026-03-08",
      owner: "Marina Reis",
      status: "revisado",
    },
    {
      id: "a6",
      name: "Plano de marketing v2",
      type: "Plano",
      uploadedAt: "2026-04-02",
      owner: "Lucas Martins",
      status: "pendente",
    },
    {
      id: "a7",
      name: "Lições aprendidas — ciclo 1",
      type: "Aprendizado",
      uploadedAt: "2026-04-28",
      owner: "Ana Coelho",
      status: "pendente",
    },
  ],
  observations: [
    {
      id: "obs1",
      title: "Cliente solicitou nova alteração de escopo após aprovação inicial",
      date: "2026-04-12",
      description:
        "Após aprovação do plano de marketing v2, o cliente solicitou inclusão de novo segmento de público, exigindo revisão de personas e materiais.",
      attribute: "Escopo",
      phenomenon: "Mudança recorrente de escopo",
      impact: "Alto",
      risk: "Elevado",
      interpretation:
        "Sinaliza fragilidade no ciclo de validação inicial e tendência de retrabalho criativo nas próximas iterações.",
      author: "Lucas Martins",
      status: "em análise",
    },
    {
      id: "obs2",
      title: "Validação do cliente atrasou 5 dias úteis",
      date: "2026-04-05",
      description:
        "Stakeholder principal do cliente ficou indisponível, gerando atraso no ciclo de aprovação do plano de mídia.",
      attribute: "Aprovação",
      phenomenon: "Atraso em validações",
      impact: "Médio",
      risk: "Moderado",
      interpretation:
        "Confirma padrão de baixa participação do cliente em momentos críticos, conforme observado em ciclos anteriores.",
      author: "Ana Coelho",
      status: "associada a discussão",
    },
    {
      id: "obs3",
      title: "Boa transparência nas evidências documentais",
      date: "2026-03-22",
      description:
        "Documentos compartilhados pelo consultor apresentam rastreabilidade clara e versionamento adequado.",
      attribute: "Transparência",
      phenomenon: "Alta colaboração",
      impact: "Baixo",
      risk: "Baixo",
      interpretation:
        "Indica maturidade observacional crescente — pode servir de referência para outros projetos do domínio.",
      author: "Marina Reis",
      status: "consolidada",
    },
  ],
  participants: [
    {
      name: "Lucas Martins",
      role: "Consultor",
      responsibility: "Responsável pela análise observacional",
    },
    {
      name: "Cliente Athos Capital",
      role: "Cliente",
      responsibility: "Validação, feedback e contexto de negócio",
    },
    {
      name: "Ana Coelho",
      role: "Administrador",
      responsibility: "Governança e curadoria do observatório",
    },
  ],
  discussions: [
    {
      id: "d1",
      question: "As mudanças de escopo surgiram após validação tardia?",
      contributions: 6,
      status: "em análise",
    },
    {
      id: "d2",
      question: "O cliente participou suficientemente da fase inicial?",
      contributions: 4,
      status: "aberta",
    },
    {
      id: "d3",
      question: "Quais artefatos explicam o aumento de retrabalho?",
      contributions: 9,
      status: "consolidada",
    },
  ],
  insights: [
    {
      id: "i1",
      narrative:
        "Projetos de Marketing Estratégico com baixa participação do cliente na fase inicial tendem a apresentar maior número de mudanças de escopo.",
      origin: "observatório",
      confidence: "alto",
      status: "consolidado",
    },
    {
      id: "i2",
      narrative:
        "A maior parte dos atrasos deste projeto está associada ao ciclo de validação dos artefatos.",
      origin: "artefatos",
      confidence: "médio",
      status: "em revisão",
    },
    {
      id: "i3",
      narrative:
        "A documentação atual apresenta boa transparência, mas ainda há risco de retrabalho criativo nas próximas iterações.",
      origin: "comunidade",
      confidence: "médio",
      status: "proposto",
    },
  ],
  timeline: [
    {
      id: "t1",
      date: "2026-02-10",
      type: "cadastro",
      description: "Projeto cadastrado no observatório",
      actor: "Ana Coelho",
    },
    {
      id: "t2",
      date: "2026-02-12",
      type: "briefing",
      description: "Briefing inicial enviado pelo cliente",
      actor: "Cliente Athos",
    },
    {
      id: "t3",
      date: "2026-02-22",
      type: "artefato",
      description: "Ata de kickoff analisada pelo consultor",
      actor: "Lucas Martins",
    },
    {
      id: "t4",
      date: "2026-03-15",
      type: "escopo",
      description: "Primeira mudança de escopo registrada",
      actor: "Cliente Athos",
    },
    {
      id: "t5",
      date: "2026-04-02",
      type: "discussão",
      description: "Discussão sobre retrabalho criativo iniciada",
      actor: "Comunidade",
    },
    {
      id: "t6",
      date: "2026-04-20",
      type: "insight",
      description: "Insight consolidado sobre engajamento do cliente",
      actor: "Observatório",
    },
    {
      id: "t7",
      date: "2026-05-22",
      type: "risco",
      description: "Risco atualizado para nível moderado",
      actor: "Observatório",
    },
  ],
  domainContext:
    "Este projeto pertence ao domínio Marketing Estratégico. Os fenômenos observados aqui contribuem para o entendimento de padrões em projetos de posicionamento, estratégia e planejamento de marca.",
};

export const projectObservatory: Record<string, ProjectObservatory> = {
  p1: base,
};

export function getProjectObservatory(id: string): ProjectObservatory {
  return projectObservatory[id] ?? base;
}
