// Display types for the project detail screen. All values come from the
// backend (services/*); this module no longer ships mock observatory data.

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
  impact: ObservationImpact;
  risk: ObservationRisk;
  interpretation: string;
  author: string;
  status: ObservationStatus;
  aiSuggested?: boolean;
  sourceExcerpt?: string;
}
