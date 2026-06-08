import type {
  Project,
  ProjectStatusCode,
  ProjectTypeCode,
  RiskLevel,
  EngagementLevel,
} from "@/types/project";
import { projects as legacyProjects } from "@/lib/mock-data";

const statusMap: Record<string, ProjectStatusCode> = {
  active: "ACTIVE",
  planning: "PLANNED",
  review: "REVIEW",
  paused: "PAUSED",
  completed: "CLOSED",
};

const typeMap: Record<string, ProjectTypeCode> = {
  Estratégico: "STRATEGIC",
  Gerencial: "MANAGERIAL",
  Híbrido: "HYBRID",
};

function deriveRisk(progress: number, status: string): RiskLevel {
  if (status === "paused") return "HIGH";
  if (status === "review" && progress < 60) return "MODERATE";
  if (progress < 30) return "MODERATE";
  if (progress >= 80) return "LOW";
  return "LOW";
}

export const mockProjects: Project[] = legacyProjects.map((p) => {
  const start = new Date(p.updatedAt);
  start.setMonth(start.getMonth() - 3);
  const end = new Date(p.updatedAt);
  end.setMonth(end.getMonth() + 3);
  const engagement: EngagementLevel = p.progress > 60 ? "HIGH" : p.progress > 30 ? "MEDIUM" : "LOW";

  return {
    id: p.id,
    name: p.name,
    domainId: p.domainId,
    clientId: `client-${p.id}`,
    consultantId: `consultant-${p.owner.toLowerCase().replace(/\s+/g, "-")}`,
    type: typeMap[p.model] ?? "STRATEGIC",
    status: statusMap[p.status] ?? "OBSERVATION",
    summary: p.summary,
    observationObjective: p.summary,
    initialAttributeIds: ["mpo-1", "mpo-3", "mpo-7"],
    expectedPhenomena: p.tags,
    progress: p.progress,
    riskLevel: deriveRisk(p.progress, p.status),
    clientEngagement: engagement,
    startDate: start.toISOString().slice(0, 10),
    expectedEndDate: end.toISOString().slice(0, 10),
    createdAt: start.toISOString().slice(0, 10),
    updatedAt: p.updatedAt,
  };
});
