export type ObservationImpact = "LOW" | "MEDIUM" | "HIGH";
export type ObservationRisk = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ObservationOrigin = "MANUAL" | "AI_SUGGESTED";
export type ObservationStatus =
  | "REGISTERED"
  | "IN_ANALYSIS"
  | "LINKED_TO_DISCUSSION"
  | "CONSOLIDATED";

export interface Observation {
  id: string;
  projectId: string;
  title: string;
  description: string;
  attributeId: string;
  phenomenonId?: string;
  impact: ObservationImpact;
  risk: ObservationRisk;
  interpretation: string;
  status: ObservationStatus;
  origin?: ObservationOrigin;
  sourceExcerpt?: string;
  suggestionId?: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}
