export type ProjectStatus = "active" | "planning" | "review" | "paused" | "completed";

export interface Domain {
  id: string;
  name: string;
  description: string;
  projectCount: number;
}

export interface Project {
  id: string;
  name: string;
  domain: string;
  domainId: string;
  status: ProjectStatus;
  summary: string;
  progress: number;
  updatedAt: string;
  tags: string[];
  model: "Estratégico" | "Gerencial" | "Híbrido";
  owner: string;
  clientName?: string;
}

export const domains: Domain[] = [
  {
    id: "d1",
    name: "Marketing Estratégico",
    description: "Posicionamento, planejamento e estratégia de marca.",
    projectCount: 4,
  },
  {
    id: "d2",
    name: "Branding",
    description: "Identidade, narrativa e expressão de marca.",
    projectCount: 3,
  },
  {
    id: "d3",
    name: "Pesquisa de Mercado",
    description: "Investigação de público, comportamento e tendências.",
    projectCount: 2,
  },
  {
    id: "d4",
    name: "Comunicação Digital",
    description: "Conteúdo, presença digital e canais.",
    projectCount: 3,
  },
  {
    id: "d5",
    name: "Gestão Comercial",
    description: "Funil, performance e expansão de receita.",
    projectCount: 2,
  },
  {
    id: "d6",
    name: "Projetos Acadêmicos",
    description: "Iniciativas de pesquisa aplicada e ensino.",
    projectCount: 1,
  },
];

export const projects: Project[] = [
  {
    id: "p1",
    name: "Reposicionamento Athos Capital",
    domain: "Marketing Estratégico",
    domainId: "d1",
    status: "active",
    summary:
      "Reconstrução do posicionamento institucional e narrativa de mercado para audiência B2B premium.",
    progress: 68,
    updatedAt: "2026-05-22",
    tags: ["B2B", "Posicionamento", "Premium"],
    model: "Estratégico",
    owner: "Ana Coelho",
  },
  {
    id: "p2",
    name: "Identidade Visual Norvik",
    domain: "Branding",
    domainId: "d2",
    status: "review",
    summary:
      "Sistema de identidade visual completo e diretrizes de aplicação para nova marca tech.",
    progress: 84,
    updatedAt: "2026-05-19",
    tags: ["Visual", "Sistema", "Tech"],
    model: "Híbrido",
    owner: "Lucas Martins",
  },
  {
    id: "p3",
    name: "Panorama Setor SaaS LATAM",
    domain: "Pesquisa de Mercado",
    domainId: "d3",
    status: "active",
    summary:
      "Mapeamento competitivo e análise de comportamento de compra em SaaS na América Latina.",
    progress: 42,
    updatedAt: "2026-05-24",
    tags: ["SaaS", "LATAM", "Competitivo"],
    model: "Estratégico",
    owner: "Marina Reis",
  },
  {
    id: "p4",
    name: "Campanha Lançamento Orion",
    domain: "Comunicação Digital",
    domainId: "d4",
    status: "planning",
    summary: "Planejamento omnichannel para lançamento de produto enterprise no segundo semestre.",
    progress: 18,
    updatedAt: "2026-05-20",
    tags: ["Lançamento", "Omnichannel"],
    model: "Gerencial",
    owner: "Pedro Almeida",
  },
  {
    id: "p5",
    name: "Funil Comercial Helix",
    domain: "Gestão Comercial",
    domainId: "d5",
    status: "active",
    summary: "Redesenho do funil de aquisição e ritual operacional do time comercial.",
    progress: 55,
    updatedAt: "2026-05-23",
    tags: ["Funil", "Operação"],
    model: "Gerencial",
    owner: "Júlia Santos",
  },
  {
    id: "p6",
    name: "Diagnóstico de Marca Vértice",
    domain: "Marketing Estratégico",
    domainId: "d1",
    status: "completed",
    summary: "Diagnóstico estratégico de marca com entregáveis de governança e roadmap.",
    progress: 100,
    updatedAt: "2026-04-30",
    tags: ["Diagnóstico", "Governança"],
    model: "Estratégico",
    owner: "Ana Coelho",
  },
  {
    id: "p7",
    name: "Pesquisa Persona Aether",
    domain: "Pesquisa de Mercado",
    domainId: "d3",
    status: "paused",
    summary: "Construção de personas qualitativas e jornadas para público de alta renda.",
    progress: 32,
    updatedAt: "2026-05-10",
    tags: ["Persona", "Qualitativa"],
    model: "Estratégico",
    owner: "Marina Reis",
  },
  {
    id: "p8",
    name: "Estratégia de Conteúdo Lumen",
    domain: "Comunicação Digital",
    domainId: "d4",
    status: "active",
    summary: "Arquitetura editorial e calendário estratégico de conteúdo para autoridade de marca.",
    progress: 61,
    updatedAt: "2026-05-21",
    tags: ["Conteúdo", "Editorial"],
    model: "Híbrido",
    owner: "Pedro Almeida",
  },
  {
    id: "p9",
    name: "Plano de Marca Korin",
    domain: "Branding",
    domainId: "d2",
    status: "planning",
    summary: "Plano de marca de longo prazo com pilares, território e arquitetura simbólica.",
    progress: 12,
    updatedAt: "2026-05-18",
    tags: ["Plano", "Território"],
    model: "Estratégico",
    owner: "Lucas Martins",
  },
];

export const statusLabels: Record<ProjectStatus, string> = {
  active: "Ativo",
  planning: "Planejamento",
  review: "Revisão",
  paused: "Pausado",
  completed: "Concluído",
};
