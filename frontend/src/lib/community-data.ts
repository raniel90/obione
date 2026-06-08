// Mock data for the ObiOne "Comunidade Observacional" layer.

export type CommunityStatus = "ativa" | "monitorada" | "em-formação";

export interface DomainCommunity {
  id: string;
  domainId: string;
  domain: string;
  description: string;
  participants: number;
  linkedProjects: number;
  discussions: number;
  insights: number;
  status: CommunityStatus;
}

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

export type CollaborativeInsightStatus = "Proposto" | "Em revisão" | "Consolidado";

export interface CollaborativeInsight {
  id: string;
  narrative: string;
  domain: string;
  evidences: number;
  confidence: number;
  participants: string[];
  status: CollaborativeInsightStatus;
}

export const communityKpis = {
  activeCommunities: 5,
  authorizedParticipants: 18,
  observationalDiscussions: 12,
  collaborativeInsights: 7,
  recentContributions: 24,
};

export const domainCommunities: DomainCommunity[] = [
  {
    id: "c1",
    domainId: "d1",
    domain: "Marketing Estratégico",
    description:
      "Comunidade voltada à interpretação de posicionamento, planejamento e estratégia de marca.",
    participants: 7,
    linkedProjects: 4,
    discussions: 5,
    insights: 3,
    status: "ativa",
  },
  {
    id: "c2",
    domainId: "d2",
    domain: "Branding",
    description: "Comunidade voltada à análise de identidade, narrativa e expressão de marca.",
    participants: 8,
    linkedProjects: 3,
    discussions: 6,
    insights: 4,
    status: "ativa",
  },
  {
    id: "c3",
    domainId: "d3",
    domain: "Pesquisa de Mercado",
    description: "Comunidade voltada à análise de público, comportamento, respostas e tendências.",
    participants: 5,
    linkedProjects: 2,
    discussions: 3,
    insights: 2,
    status: "monitorada",
  },
  {
    id: "c4",
    domainId: "d4",
    domain: "Comunicação Digital",
    description: "Comunidade voltada à análise de campanhas, canais, conteúdo e presença digital.",
    participants: 6,
    linkedProjects: 3,
    discussions: 4,
    insights: 3,
    status: "ativa",
  },
  {
    id: "c5",
    domainId: "d5",
    domain: "Gestão Comercial",
    description:
      "Comunidade voltada à análise de funil, performance, operação e estratégia comercial.",
    participants: 4,
    linkedProjects: 2,
    discussions: 2,
    insights: 1,
    status: "em-formação",
  },
];

export const communityStatusLabels: Record<CommunityStatus, string> = {
  ativa: "Ativa",
  monitorada: "Monitorada",
  "em-formação": "Em formação",
};

export const participants: CommunityParticipant[] = [
  { id: "p1", name: "Ana Coelho", role: "admin", participation: "Governança", status: "ativo" },
  {
    id: "p2",
    name: "Lucas Martins",
    role: "consultor",
    domain: "Marketing Estratégico · Branding",
    participation: "Interpretação",
    status: "ativo",
  },
  {
    id: "p3",
    name: "Marina Reis",
    role: "consultor",
    domain: "Pesquisa de Mercado",
    participation: "Curadoria",
    status: "ativo",
  },
  {
    id: "p4",
    name: "Pedro Almeida",
    role: "consultor",
    domain: "Comunicação Digital",
    participation: "Interpretação",
    status: "ativo",
  },
  {
    id: "p5",
    name: "Cliente Athos Capital",
    role: "cliente",
    project: "Reposicionamento Athos Capital",
    participation: "Feedback",
    status: "ativo",
  },
  {
    id: "p6",
    name: "Cliente Norvik",
    role: "cliente",
    project: "Identidade Visual Norvik",
    participation: "Validação",
    status: "convidado",
  },
  {
    id: "p7",
    name: "Cliente LATAM",
    role: "cliente",
    project: "Panorama Setor SaaS LATAM",
    participation: "Acompanhamento",
    status: "aguardando-validação",
  },
];

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

export const discussions: Discussion[] = [
  {
    id: "ds1",
    title: "Por que projetos de Branding apresentam mais mudanças de escopo?",
    domain: "Branding",
    project: "Identidade Visual Norvik",
    phenomenon: "Mudança recorrente de escopo",
    originObservation:
      "Cliente solicitou nova revisão dos materiais visuais após aprovação inicial.",
    investigativeQuestion:
      "Quais sinais aparecem antes das mudanças de escopo recorrentes em projetos de Branding?",
    contributions: 8,
    lastParticipant: "Lucas Martins",
    status: "Aberta",
    visibility: "Consultores vinculados",
    contributionsList: [
      {
        id: "c-ds1-1",
        participant: "Lucas Martins",
        role: "consultor",
        text: "A mudança de escopo ocorreu após uma validação tardia do cliente.",
        date: "2026-04-15",
        type: "Interpretação",
      },
      {
        id: "c-ds1-2",
        participant: "Cliente Norvik",
        role: "cliente",
        text: "A decisão dependia da diretoria, por isso houve atraso na resposta.",
        date: "2026-04-16",
        type: "Feedback",
      },
      {
        id: "c-ds1-3",
        participant: "Ana Coelho",
        role: "admin",
        text: "Esse padrão já apareceu em outros projetos do domínio Branding.",
        date: "2026-04-18",
        type: "Validação",
      },
    ],
  },
  {
    id: "ds2",
    title: "A baixa participação do cliente impactou o atraso em projetos estratégicos?",
    domain: "Marketing Estratégico",
    project: "Reposicionamento Athos Capital",
    phenomenon: "Baixa participação do cliente",
    originObservation:
      "Validação do cliente atrasou 5 dias úteis no ciclo de aprovação do plano de mídia.",
    investigativeQuestion:
      "A baixa participação do cliente nas fases iniciais aumentou o retrabalho?",
    contributions: 5,
    lastParticipant: "Cliente Athos Capital",
    status: "Em análise",
    visibility: "Participantes do projeto",
    contributionsList: [
      {
        id: "c-ds2-1",
        participant: "Lucas Martins",
        role: "consultor",
        text: "Há correlação clara entre os atrasos de validação e o aumento do retrabalho.",
        date: "2026-04-08",
        type: "Hipótese",
      },
      {
        id: "c-ds2-2",
        participant: "Cliente Athos Capital",
        role: "cliente",
        text: "Reconhecemos o atraso e estamos revendo o ritual de aprovações.",
        date: "2026-04-10",
        type: "Feedback",
      },
    ],
  },
  {
    id: "ds3",
    title: "Quais sinais indicam risco de retrabalho em campanhas digitais?",
    domain: "Comunicação Digital",
    project: "Campanha Lançamento Orion",
    phenomenon: "Volatilidade de requisitos",
    originObservation: "Três versões de roteiro foram solicitadas em menos de duas semanas.",
    investigativeQuestion: "Quais sinais antecipam o risco de retrabalho em campanhas multicanal?",
    contributions: 6,
    lastParticipant: "Pedro Almeida",
    status: "Revisada",
    visibility: "Comunidade do domínio",
    contributionsList: [
      {
        id: "c-ds3-1",
        participant: "Pedro Almeida",
        role: "consultor",
        text: "Volatilidade em briefings parece anteceder o retrabalho criativo.",
        date: "2026-03-28",
        type: "Interpretação",
      },
    ],
  },
  {
    id: "ds4",
    title: "Atrasos em Pesquisa de Mercado estão relacionados à baixa taxa de resposta?",
    domain: "Pesquisa de Mercado",
    project: "Panorama Setor SaaS LATAM",
    phenomenon: "Atraso em validações",
    originObservation:
      "Taxa de resposta da pesquisa ficou 28% abaixo do projetado nas duas primeiras semanas.",
    investigativeQuestion: "A baixa taxa de resposta explica os atrasos em projetos de pesquisa?",
    contributions: 4,
    lastParticipant: "Marina Reis",
    status: "Consolidada",
    visibility: "Consultores vinculados",
    contributionsList: [
      {
        id: "c-ds4-1",
        participant: "Marina Reis",
        role: "consultor",
        text: "Há evidências consistentes — vamos consolidar como conhecimento do domínio.",
        date: "2026-03-22",
        type: "Validação",
      },
    ],
  },
];

export const communityKnowledge: CommunityKnowledge[] = [
  {
    id: "kn1",
    title: "Baixa participação do cliente aumenta risco de atraso",
    domain: "Marketing Estratégico",
    project: "Reposicionamento Athos Capital",
    phenomenon: "Baixa participação do cliente",
    summary:
      "Projetos com baixa participação do cliente nas fases iniciais tendem a apresentar mais mudanças de escopo, maior retrabalho e maior risco de atraso.",
    evidences:
      "3 atrasos de aprovação, 2 mudanças de escopo após validação inicial e 5 dias médios de espera por feedback.",
    recommendation:
      "Definir responsáveis decisórios e rituais de validação antes do início do projeto.",
    confidence: "Alto",
    status: "Consolidado",
    originDiscussion: "ds2",
  },
  {
    id: "kn2",
    title: "Mudanças de escopo em Branding surgem após validações tardias",
    domain: "Branding",
    project: "Identidade Visual Norvik",
    phenomenon: "Mudança recorrente de escopo",
    summary:
      "Projetos de Branding apresentam maior retrabalho quando o cliente valida artefatos criativos apenas no fim do ciclo.",
    evidences:
      "8 alterações de escopo após aprovação inicial em 3 projetos consecutivos do domínio.",
    recommendation: "Antecipar validações intermediárias e registrar critérios de aceite criativo.",
    confidence: "Médio",
    status: "Em revisão",
    originDiscussion: "ds1",
  },
  {
    id: "kn3",
    title: "Baixa taxa de resposta antecipa atrasos em pesquisa",
    domain: "Pesquisa de Mercado",
    project: "Panorama Setor SaaS LATAM",
    phenomenon: "Atraso em validações",
    summary:
      "Pesquisas com taxa de resposta abaixo de 30% nas duas primeiras semanas apresentam alto risco de atraso na consolidação dos resultados.",
    evidences: "Histórico de 4 projetos com defasagem média de 11 dias na entrega final.",
    recommendation: "Planejar reforços de coleta e amostras complementares já na semana 1.",
    confidence: "Alto",
    status: "Consolidado",
    originDiscussion: "ds4",
  },
];

export const collaborativeInsights: CollaborativeInsight[] = [
  {
    id: "ci1",
    narrative:
      "Projetos com maior participação do cliente nas fases iniciais apresentaram menor retrabalho.",
    domain: "Marketing Estratégico",
    evidences: 9,
    confidence: 0.82,
    participants: ["Lucas Martins", "Cliente Athos Capital"],
    status: "Consolidado",
  },
  {
    id: "ci2",
    narrative: "Campanhas multicanal demonstraram maior volatilidade de requisitos.",
    domain: "Comunicação Digital",
    evidences: 7,
    confidence: 0.71,
    participants: ["Pedro Almeida", "Ana Coelho"],
    status: "Em revisão",
  },
  {
    id: "ci3",
    narrative: "Projetos com artefatos bem documentados apresentaram maior transparência.",
    domain: "Transversal",
    evidences: 11,
    confidence: 0.78,
    participants: ["Ana Coelho", "Marina Reis"],
    status: "Consolidado",
  },
  {
    id: "ci4",
    narrative:
      "Mudanças de escopo recorrentes em Branding costumam surgir após validações tardias.",
    domain: "Branding",
    evidences: 6,
    confidence: 0.69,
    participants: ["Lucas Martins", "Cliente Norvik"],
    status: "Em revisão",
  },
  {
    id: "ci5",
    narrative:
      "Projetos de Pesquisa de Mercado dependem fortemente da qualidade da base de respondentes.",
    domain: "Pesquisa de Mercado",
    evidences: 5,
    confidence: 0.74,
    participants: ["Marina Reis"],
    status: "Proposto",
  },
];
