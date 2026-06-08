// Mock data for the ObiOne observatory layers:
// phenomena, insights, observations feed and attribute map.

export type PhenomenonSeverity = "low" | "medium" | "high";

export interface Phenomenon {
  id: string;
  title: string;
  description: string;
  domain: string;
  severity: PhenomenonSeverity;
  trend: "up" | "down" | "stable";
  evidenceCount: number;
  sparkline: number[];
}

export interface Insight {
  id: string;
  category: "Tendência emergente" | "Padrão identificado" | "Análise textual" | "Resumo automático" | "Comunidade";
  narrative: string;
  signal: string;
  confidence: number; // 0..1
}

export type ObservationType =
  | "padrão"
  | "discussão"
  | "revisão"
  | "artefato"
  | "alerta"
  | "descoberta";

export interface Observation {
  id: string;
  type: ObservationType;
  text: string;
  actor: string;
  domain: string;
  timeAgo: string;
}

export interface AttributeMap {
  id: string;
  phenomenon: string;
  general: { label: string; value: string }[];
  specific: { label: string; value: string }[];
  intermediate: { label: string; value: string; tone: "risk" | "engagement" | "maturity" }[];
  interpretation: string;
}

export const phenomena: Phenomenon[] = [
  {
    id: "ph1",
    title: "Projetos híbridos com maior volatilidade de escopo",
    description:
      "Iniciativas que combinam metodologias apresentam taxa de alteração de escopo 2,3× superior à média do observatório.",
    domain: "Transversal",
    severity: "high",
    trend: "up",
    evidenceCount: 14,
    sparkline: [2, 3, 3, 5, 6, 5, 8, 9, 11, 12, 14],
  },
  {
    id: "ph2",
    title: "Branding concentra maior engajamento da comunidade",
    description:
      "Discussões, comentários e revisões colaborativas em projetos de Branding superam a média em 47%.",
    domain: "Branding",
    severity: "low",
    trend: "up",
    evidenceCount: 9,
    sparkline: [4, 4, 5, 6, 6, 7, 8, 8, 9, 9, 9],
  },
  {
    id: "ph3",
    title: "Baixa participação do cliente eleva risco de atraso",
    description:
      "Projetos com menos de 2 interações semanais do cliente concentram 71% dos atrasos observados no ciclo.",
    domain: "Marketing Estratégico",
    severity: "high",
    trend: "up",
    evidenceCount: 7,
    sparkline: [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7],
  },
  {
    id: "ph4",
    title: "Alta interação correlaciona com melhor conclusão",
    description:
      "Domínios com alto índice de colaboração apresentam taxa de conclusão 38% acima da média.",
    domain: "Comunicação Digital",
    severity: "medium",
    trend: "stable",
    evidenceCount: 11,
    sparkline: [5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8],
  },
];

export const insights: Insight[] = [
  {
    id: "in1",
    category: "Padrão identificado",
    narrative:
      "Projetos com maior frequência de feedback apresentaram menor incidência de retrabalho — a cadência de revisão funciona como sinal precoce de saúde do projeto.",
    signal: "Cadência de revisão × Retrabalho",
    confidence: 0.86,
  },
  {
    id: "in2",
    category: "Tendência emergente",
    narrative:
      "Domínio de Branding está concentrando atenção colaborativa do observatório — três dos quatro projetos mais comentados do ciclo pertencem a este domínio.",
    signal: "Atenção colaborativa",
    confidence: 0.74,
  },
  {
    id: "in3",
    category: "Análise textual",
    narrative:
      "Termos como 'escopo', 'aprovação' e 'cliente' co-ocorrem em 62% dos comentários de projetos em risco — vocabulário recorrente sinaliza fricção contratual.",
    signal: "Co-ocorrência semântica",
    confidence: 0.68,
  },
  {
    id: "in4",
    category: "Resumo automático",
    narrative:
      "Nos últimos 14 dias, o observatório registrou aumento de 22% em eventos específicos do tipo 'mudança de escopo', com concentração em projetos híbridos.",
    signal: "Δ eventos × metodologia",
    confidence: 0.81,
  },
  {
    id: "in5",
    category: "Comunidade",
    narrative:
      "Projetos com validação tardia do cliente apresentam maior risco de retrabalho — interpretação consolidada pela comunidade do domínio Marketing Estratégico.",
    signal: "Validação tardia × Retrabalho",
    confidence: 0.78,
  },
];

export const observations: Observation[] = [
  { id: "ob1", type: "discussão", text: "Nova discussão observacional criada no domínio Branding.", actor: "Lucas Martins", domain: "Branding", timeAgo: "há 10 min" },
  { id: "ob2", type: "descoberta", text: "Conhecimento consolidado sobre baixa participação do cliente.", actor: "Ana Coelho", domain: "Marketing Estratégico", timeAgo: "há 40 min" },
  { id: "ob3", type: "padrão", text: "Comunidade validou padrão de retrabalho em Branding.", actor: "Comunidade · Branding", domain: "Branding", timeAgo: "há 1 h" },
  { id: "ob4", type: "revisão", text: "Discussão sobre atraso em Pesquisa de Mercado entrou em análise.", actor: "Marina Reis", domain: "Pesquisa de Mercado", timeAgo: "há 2 h" },
  { id: "ob5", type: "descoberta", text: "Insight colaborativo publicado em Comunicação Digital.", actor: "Pedro Almeida", domain: "Comunicação Digital", timeAgo: "há 3 h" },
  { id: "ob6", type: "alerta", text: "Projeto Identidade Visual Norvik teve risco atualizado para Moderado.", actor: "Ana Coelho", domain: "Branding", timeAgo: "há 5 h" },
];

export const attributeMaps: AttributeMap[] = [
  {
    id: "am1",
    phenomenon: "Tendência de atraso",
    general: [
      { label: "Domínio", value: "Branding" },
      { label: "Metodologia", value: "Híbrido" },
      { label: "Tipo", value: "Estratégico" },
    ],
    specific: [
      { label: "Mudanças de escopo", value: "12" },
      { label: "Atrasos de aprovação", value: "3" },
      { label: "Interação do cliente", value: "Baixa" },
    ],
    intermediate: [
      { label: "Risco de atraso", value: "Elevado", tone: "risk" },
      { label: "Engajamento", value: "Médio", tone: "engagement" },
      { label: "Maturidade", value: "Em formação", tone: "maturity" },
    ],
    interpretation:
      "Projetos com alta mudança de escopo e baixa participação do cliente apresentam maior risco de atraso. O observatório recomenda acompanhamento próximo do ciclo de aprovação.",
  },
  {
    id: "am2",
    phenomenon: "Engajamento acelerado",
    general: [
      { label: "Domínio", value: "Comunicação Digital" },
      { label: "Metodologia", value: "Gerencial" },
      { label: "Tipo", value: "Operacional" },
    ],
    specific: [
      { label: "Comentários / semana", value: "27" },
      { label: "Revisões colaborativas", value: "9" },
      { label: "Artefatos publicados", value: "5" },
    ],
    intermediate: [
      { label: "Índice de colaboração", value: "Alto", tone: "engagement" },
      { label: "Transparência", value: "Alta", tone: "maturity" },
      { label: "Risco", value: "Baixo", tone: "risk" },
    ],
    interpretation:
      "Cadência alta de revisões e comentários sinaliza maturidade colaborativa. Padrão recomendado como referência para outros domínios.",
  },
];

export const observatoryKpis = {
  patternsDetected: 18,
  emergingTrends: 4,
  intermediateAlerts: 6,
  collaborationIndex: 72, // 0..100
};
