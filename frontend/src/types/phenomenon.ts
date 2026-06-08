export type PhenomenonTrend = "STABLE" | "GROWING" | "DECREASING";
export type PhenomenonStatus = "OBSERVED" | "IN_ANALYSIS" | "CONSOLIDATED";
export type PhenomenonImpact = "LOW" | "MEDIUM" | "HIGH";

export interface Phenomenon {
  id: string;
  domainId: string;
  projectId?: string;
  name: string;
  description: string;
  evidenceCount: number;
  relatedAttributeIds: string[];
  impact: PhenomenonImpact;
  trend: PhenomenonTrend;
  status: PhenomenonStatus;
}
