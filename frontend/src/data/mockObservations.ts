import type { Observation } from "@/types/observation";

export const mockObservations: Observation[] = [
  {
    id: "obs-1",
    projectId: "p1",
    title: "Cliente postergou rito de validação inicial",
    description:
      "A validação estratégica foi remarcada duas vezes, alongando o ciclo de aprovação em 7 dias.",
    attributeId: "mpo-3",
    phenomenonId: "ph-d1-1",
    impact: "HIGH",
    risk: "HIGH",
    interpretation: "Sinal precoce de instabilidade de posicionamento e potencial retrabalho.",
    status: "IN_ANALYSIS",
    createdBy: "u2",
    createdAt: "2026-05-20",
  },
  {
    id: "obs-2",
    projectId: "p2",
    title: "Nova solicitação de alteração visual após aprovação",
    description:
      "Diretoria do cliente pediu revisão dos materiais já aprovados pelo time criativo.",
    attributeId: "mpo-7",
    impact: "MEDIUM",
    risk: "MODERATE",
    interpretation: "Mudança de escopo recorrente após validação tardia.",
    status: "LINKED_TO_DISCUSSION",
    createdBy: "u2",
    createdAt: "2026-05-18",
  },
  {
    id: "obs-3",
    projectId: "p3",
    title: "Taxa de resposta da pesquisa abaixo do projetado",
    description: "Coleta da semana 2 ficou 28% abaixo da meta planejada.",
    attributeId: "mpo-5",
    impact: "HIGH",
    risk: "CRITICAL",
    interpretation: "Probabilidade alta de atraso na consolidação dos resultados.",
    status: "CONSOLIDATED",
    createdBy: "u3",
    createdAt: "2026-05-22",
  },
];
