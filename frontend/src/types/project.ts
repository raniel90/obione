export type ProjectTypeCode = "STRATEGIC" | "MANAGERIAL" | "HYBRID";
export type ProjectStatusCode =
  | "OBSERVATION"
  | "PLANNED"
  | "ACTIVE"
  | "RISK"
  | "REVIEW"
  | "PAUSED"
  | "CLOSED";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type EngagementLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Project {
  id: string;
  name: string;
  domainId: string;
  clientId: string;
  clientName?: string;
  consultantId: string;
  consultantName?: string;
  type: ProjectTypeCode;
  status: ProjectStatusCode;
  summary: string;
  observationObjective: string;
  initialAttributeIds: string[];
  expectedPhenomena: string[];
  progress: number;
  riskLevel: RiskLevel;
  clientEngagement: EngagementLevel;
  startDate: string;
  expectedEndDate: string;
  createdAt: string;
  updatedAt: string;
}
