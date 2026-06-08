// Extended observatory metadata for each domain — used by the Domains
// listing and detail screens. Pure mock data, no backend.

export type DomainType = "Estratégico" | "Gerencial" | "Híbrido" | "Acadêmico";
export type DomainStatus = "ativo" | "em-formação" | "monitorado" | "em-revisão";

export interface DomainPhenomenon {
  id: string;
  title: string;
  evidences: string[];
  impact: string;
  trend: "up" | "down" | "stable";
}

export interface DomainInsight {
  id: string;
  narrative: string;
  signal: string;
}

export interface DomainObservation {
  id: string;
  text: string;
  actor: string;
  timeAgo: string;
  type: "vínculo" | "artefato" | "insight" | "fenômeno" | "discussão";
}

export interface DomainObservatory {
  id: string;
  type: DomainType;
  status: DomainStatus;
  objective: string;
  indicators: string[]; // prioritized indicators
  engagement: number; // 0..100
  risk: "baixo" | "médio" | "elevado";
  maturity: "em formação" | "em consolidação" | "consolidado";
  mainPhenomenon: string;
  activePhenomena: number;
  phenomena: DomainPhenomenon[];
  insights: DomainInsight[];
  observations: DomainObservation[];
}

export const domainObservatory: Record<string, DomainObservatory> = {
  d1: {
    id: "d1",
    type: "Estratégico",
    status: "ativo",
    objective:
      "Observar como o posicionamento estratégico se sustenta ao longo do ciclo dos projetos.",
    indicators: ["Risco", "Mudanças de escopo", "Aprendizado"],
    engagement: 64,
    risk: "médio",
    maturity: "em consolidação",
    mainPhenomenon: "Instabilidade de posicionamento em projetos com baixa validação inicial",
    activePhenomena: 2,
    phenomena: [
      {
        id: "ph-d1-1",
        title: "Instabilidade de posicionamento em projetos com baixa validação inicial",
        evidences: ["7 ajustes estratégicos registrados", "2 ciclos de validação postergados"],
        impact: "Aumento de retrabalho nas etapas finais",
        trend: "up",
      },
      {
        id: "ph-d1-2",
        title: "Diagnósticos estratégicos antecipam decisões de governança",
        evidences: ["3 entregáveis de governança aprovados", "Alinhamento entre comitês"],
        impact: "Maior previsibilidade do roadmap",
        trend: "stable",
      },
    ],
    insights: [
      {
        id: "in-d1-1",
        narrative:
          "Projetos estratégicos que iniciam sem rito de validação concentram 64% dos ajustes de posicionamento observados no ciclo.",
        signal: "Validação inicial × estabilidade",
      },
    ],
    observations: [
      { id: "o-d1-1", type: "fenômeno", text: "Fenômeno de instabilidade revisado pela comunidade.", actor: "Ana Coelho", timeAgo: "há 2 h" },
      { id: "o-d1-2", type: "insight", text: "Novo insight gerado a partir do projeto Athos Capital.", actor: "ObiOne · IA", timeAgo: "há 6 h" },
      { id: "o-d1-3", type: "vínculo", text: "Projeto Diagnóstico Vértice concluído e arquivado.", actor: "Ana Coelho", timeAgo: "há 1 d" },
    ],
  },
  d2: {
    id: "d2",
    type: "Híbrido",
    status: "ativo",
    objective:
      "Acompanhar a expressão simbólica e a coerência criativa das marcas observadas.",
    indicators: ["Mudanças de escopo", "Engajamento", "Colaboração"],
    engagement: 78,
    risk: "elevado",
    maturity: "em consolidação",
    mainPhenomenon: "Mudanças recorrentes de escopo criativo",
    activePhenomena: 3,
    phenomena: [
      {
        id: "ph-d2-1",
        title: "Mudanças recorrentes de escopo criativo",
        evidences: ["12 alterações registradas", "3 ciclos de aprovação reabertos"],
        impact: "Aumento do risco de atraso",
        trend: "up",
      },
      {
        id: "ph-d2-2",
        title: "Alta colaboração em revisões de identidade visual",
        evidences: ["27 comentários/semana", "9 revisões colaborativas"],
        impact: "Maturidade colaborativa elevada",
        trend: "up",
      },
    ],
    insights: [
      {
        id: "in-d2-1",
        narrative:
          "Projetos de Branding com baixa participação do cliente nas fases iniciais tendem a apresentar mais retrabalho nas etapas de aprovação.",
        signal: "Participação inicial × retrabalho",
      },
      {
        id: "in-d2-2",
        narrative:
          "Domínio concentra três dos quatro projetos mais comentados do ciclo — sinal de atenção colaborativa.",
        signal: "Atenção colaborativa",
      },
    ],
    observations: [
      { id: "o-d2-1", type: "fenômeno", text: "Novo fenômeno identificado: mudanças de escopo criativo.", actor: "ObiOne · IA", timeAgo: "há 18 min" },
      { id: "o-d2-2", type: "artefato", text: "Artefato analisado em Identidade Visual Norvik.", actor: "Lucas Martins", timeAgo: "há 3 h" },
      { id: "o-d2-3", type: "discussão", text: "Discussão aberta sobre arquitetura simbólica de Korin.", actor: "Marina Reis", timeAgo: "há 5 h" },
      { id: "o-d2-4", type: "insight", text: "Insight 'participação × retrabalho' validado.", actor: "Comunidade", timeAgo: "há 1 d" },
    ],
  },
  d3: {
    id: "d3",
    type: "Acadêmico",
    status: "monitorado",
    objective:
      "Investigar comportamentos de público e padrões de mercado a partir de evidências coletadas.",
    indicators: ["Aprendizado", "Transparência", "Engajamento"],
    engagement: 52,
    risk: "médio",
    maturity: "em formação",
    mainPhenomenon: "Atrasos associados à baixa taxa de resposta dos participantes",
    activePhenomena: 1,
    phenomena: [
      {
        id: "ph-d3-1",
        title: "Atrasos associados à baixa taxa de resposta dos participantes",
        evidences: ["2 estudos com taxa < 30%", "1 cronograma reaberto"],
        impact: "Atraso de entregáveis qualitativos",
        trend: "up",
      },
    ],
    insights: [
      {
        id: "in-d3-1",
        narrative:
          "Estudos qualitativos com amostras pequenas concentram observações mais densas, mas exigem mais tempo de campo.",
        signal: "Densidade × tempo de campo",
      },
    ],
    observations: [
      { id: "o-d3-1", type: "artefato", text: "Novo artefato de pesquisa publicado em Panorama SaaS LATAM.", actor: "Marina Reis", timeAgo: "há 4 h" },
      { id: "o-d3-2", type: "fenômeno", text: "Fenômeno de baixa resposta sinalizado pelo observatório.", actor: "ObiOne · IA", timeAgo: "há 1 d" },
    ],
  },
  d4: {
    id: "d4",
    type: "Gerencial",
    status: "ativo",
    objective:
      "Observar a coerência editorial e a continuidade das narrativas em canais digitais.",
    indicators: ["Engajamento", "Colaboração", "Transparência"],
    engagement: 71,
    risk: "médio",
    maturity: "em consolidação",
    mainPhenomenon: "Alta volatilidade de requisitos em campanhas multicanal",
    activePhenomena: 2,
    phenomena: [
      {
        id: "ph-d4-1",
        title: "Alta volatilidade de requisitos em campanhas multicanal",
        evidences: ["8 ajustes de briefing", "4 trocas de canal prioritário"],
        impact: "Esforço duplicado em produção criativa",
        trend: "up",
      },
      {
        id: "ph-d4-2",
        title: "Cadência editorial estável em projetos consolidados",
        evidences: ["Calendário editorial cumprido em 92% dos ciclos"],
        impact: "Previsibilidade de entrega",
        trend: "stable",
      },
    ],
    insights: [
      {
        id: "in-d4-1",
        narrative:
          "Campanhas com mais de três canais simultâneos apresentam volatilidade de requisitos 1,8× superior ao padrão do domínio.",
        signal: "Canais simultâneos × volatilidade",
      },
    ],
    observations: [
      { id: "o-d4-1", type: "vínculo", text: "Projeto Lançamento Orion vinculado ao domínio.", actor: "Pedro Almeida", timeAgo: "há 2 h" },
      { id: "o-d4-2", type: "insight", text: "Insight de volatilidade editorial gerado.", actor: "ObiOne · IA", timeAgo: "há 7 h" },
    ],
  },
  d5: {
    id: "d5",
    type: "Gerencial",
    status: "em-revisão",
    objective:
      "Observar a relação entre operação comercial e direcionamento estratégico.",
    indicators: ["Risco", "Transparência", "Aprendizado"],
    engagement: 58,
    risk: "médio",
    maturity: "em consolidação",
    mainPhenomenon: "Maior dependência de alinhamento entre operação e estratégia",
    activePhenomena: 1,
    phenomena: [
      {
        id: "ph-d5-1",
        title: "Maior dependência de alinhamento entre operação e estratégia",
        evidences: ["5 rituais comerciais redesenhados", "2 metas reposicionadas no trimestre"],
        impact: "Ciclos comerciais mais sensíveis a mudanças de direção",
        trend: "stable",
      },
    ],
    insights: [
      {
        id: "in-d5-1",
        narrative:
          "Operações comerciais com ritual semanal estruturado apresentam menor variância de previsão de receita.",
        signal: "Ritual × previsibilidade",
      },
    ],
    observations: [
      { id: "o-d5-1", type: "artefato", text: "Funil comercial Helix atualizado.", actor: "Júlia Santos", timeAgo: "há 9 h" },
    ],
  },
  d6: {
    id: "d6",
    type: "Acadêmico",
    status: "em-formação",
    objective:
      "Acompanhar a maturação de iniciativas de pesquisa aplicada e ensino.",
    indicators: ["Aprendizado", "Transparência", "Colaboração"],
    engagement: 41,
    risk: "baixo",
    maturity: "em formação",
    mainPhenomenon: "Baixa frequência de evidências formais nos primeiros ciclos",
    activePhenomena: 0,
    phenomena: [],
    insights: [
      {
        id: "in-d6-1",
        narrative:
          "Domínio em formação — observatório ainda coletando linha de base para identificar fenômenos.",
        signal: "Linha de base inicial",
      },
    ],
    observations: [
      { id: "o-d6-1", type: "vínculo", text: "Domínio configurado para observação contínua.", actor: "ObiOne · IA", timeAgo: "há 2 d" },
    ],
  },
};

export const domainTypeOptions: DomainType[] = ["Estratégico", "Gerencial", "Híbrido", "Acadêmico"];

export const indicatorOptions = [
  "Risco",
  "Engajamento",
  "Mudanças de escopo",
  "Transparência",
  "Colaboração",
  "Aprendizado",
];

export const domainStatusLabels: Record<DomainStatus, string> = {
  ativo: "Ativo",
  "em-formação": "Em formação",
  monitorado: "Monitorado",
  "em-revisão": "Em revisão",
};
