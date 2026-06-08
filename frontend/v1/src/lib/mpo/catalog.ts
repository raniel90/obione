import type { Domain } from "@/lib/api/types";

export type RenderType =
  | "text"
  | "date"
  | "currency"
  | "array"
  | "enum_porte"
  | "enum_status"
  | "out_of_scope";

export interface AttributeDef {
  key: string;
  label: string;
  renderType: RenderType;
  outOfScope?: boolean;
}

export interface CategoryDef {
  key: string;
  label: string;
  attributes: AttributeDef[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    key: "conteudo_geral",
    label: "Conteúdo geral",
    attributes: [
      { key: "nome_projeto", label: "Nome do projeto", renderType: "text" },
      { key: "descricao", label: "Descrição", renderType: "text" },
      { key: "local_execucao", label: "Local de execução", renderType: "text" },
      { key: "tipo", label: "Tipo", renderType: "text" },
      { key: "porte", label: "Porte", renderType: "enum_porte" },
      { key: "objetivos", label: "Objetivos", renderType: "text" },
      { key: "descricao_produtos_servicos", label: "Produtos e serviços", renderType: "text" },
      { key: "licitacao", label: "Licitação", renderType: "text" },
      { key: "contratos", label: "Contratos", renderType: "text" },
      { key: "termo_encerramento", label: "Termo de encerramento", renderType: "text" },
      { key: "justificativas_projeto", label: "Justificativas do projeto", renderType: "text" },
      { key: "impactos_projeto", label: "Impactos do projeto", renderType: "text" },
      { key: "indicadores_projeto", label: "Indicadores (KPIs)", renderType: "text" },
      { key: "artefatos_produzidos", label: "Artefatos produzidos", renderType: "text" },
    ],
  },
  {
    key: "stakeholders",
    label: "Stakeholders",
    attributes: [
      { key: "nome_stakeholders", label: "Stakeholders", renderType: "array" },
      { key: "funcao_projeto", label: "Funções no projeto", renderType: "array" },
      { key: "publico_alvo", label: "Público-alvo", renderType: "text" },
      { key: "detalhes_equipe", label: "Detalhes da equipe", renderType: "text" },
      { key: "treinamentos_equipes", label: "Treinamentos das equipes", renderType: "text" },
    ],
  },
  {
    key: "escopo",
    label: "Escopo",
    attributes: [
      { key: "tarefas_projeto", label: "Tarefas do projeto", renderType: "text" },
      { key: "requisitos", label: "Requisitos", renderType: "text" },
      { key: "escopo_planejado", label: "Escopo planejado", renderType: "text" },
      { key: "escopo_executado", label: "Escopo executado", renderType: "text" },
    ],
  },
  {
    key: "cronograma",
    label: "Cronograma",
    attributes: [
      { key: "data_inicio", label: "Data de início", renderType: "date" },
      { key: "data_fim_planejada", label: "Data fim (planejada)", renderType: "date" },
      { key: "data_fim_executada", label: "Data fim (executada)", renderType: "date" },
      { key: "entregas_realizadas", label: "Entregas realizadas", renderType: "text" },
      { key: "status_cronograma", label: "Status do cronograma", renderType: "enum_status" },
    ],
  },
  {
    key: "custos",
    label: "Custos",
    attributes: [
      { key: "custo_estimado", label: "Custo estimado", renderType: "currency" },
      { key: "custo_realizado", label: "Custo realizado", renderType: "currency" },
      { key: "justificativas_gastos", label: "Justificativas dos gastos", renderType: "text" },
    ],
  },
  {
    key: "riscos",
    label: "Riscos",
    attributes: [
      { key: "riscos_identificados", label: "Riscos identificados", renderType: "text" },
      { key: "analise_qualitativa_riscos", label: "Análise qualitativa de riscos", renderType: "text" },
      { key: "analise_quantitativa_riscos", label: "Análise quantitativa de riscos", renderType: "text" },
      { key: "planejamento_respostas_riscos", label: "Planejamento de respostas a riscos", renderType: "text" },
      { key: "monitoramento_riscos", label: "Monitoramento de riscos", renderType: "text" },
    ],
  },
  {
    key: "mudancas",
    label: "Mudanças",
    attributes: [
      { key: "custo_implementacao_mudanca", label: "Custo de implementação da mudança", renderType: "currency" },
      { key: "analise_custo_beneficio", label: "Análise custo-benefício", renderType: "text" },
      { key: "impactos_mudanca", label: "Impactos da mudança", renderType: "text" },
    ],
  },
  {
    key: "licoes_aprendidas",
    label: "Lições aprendidas",
    attributes: [
      { key: "pontos_fortes", label: "Pontos fortes", renderType: "text" },
      { key: "pontos_fracos", label: "Pontos fracos", renderType: "text" },
      { key: "dificuldades_encontradas", label: "Dificuldades encontradas", renderType: "text" },
      { key: "providencias_tomadas", label: "Providências tomadas", renderType: "text" },
    ],
  },
];

export const DOMAIN_LABELS: Record<Domain, string> = {
  legal: "Jurídico",
  health: "Saúde",
  sports: "Esportes",
  branding: "Branding",
  gastronomy: "Gastronomia",
  other: "Outro",
};

export const PORTE_LABELS: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export const STATUS_CRONOGRAMA_LABELS: Record<string, string> = {
  no_prazo: "No prazo",
  atrasado: "Atrasado",
  adiantado: "Adiantado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
