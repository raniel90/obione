import type { Domain, DomainTypeCode, DomainStatusCode } from "@/types/domain";
import { domains as legacyDomains } from "@/lib/mock-data";
import { domainObservatory } from "@/lib/domain-observatory";
import { slugifyDomain } from "@/lib/community-utils";

const communityStats: Record<
  string,
  { participants: number; discussions: number; insights: number }
> = {
  d1: { participants: 7, discussions: 5, insights: 3 },
  d2: { participants: 8, discussions: 6, insights: 4 },
  d3: { participants: 5, discussions: 3, insights: 2 },
  d4: { participants: 6, discussions: 4, insights: 3 },
  d5: { participants: 4, discussions: 2, insights: 1 },
};

const typeMap: Record<string, DomainTypeCode> = {
  Estratégico: "STRATEGIC",
  Gerencial: "MANAGERIAL",
  Híbrido: "HYBRID",
  Acadêmico: "ACADEMIC",
};

const statusMap: Record<string, DomainStatusCode> = {
  ativo: "ACTIVE",
  monitorado: "MONITORED",
  "em-revisão": "IN_REVIEW",
  "em-formação": "FORMING",
};

export const mockDomains: Domain[] = legacyDomains.map((d) => {
  const obs = domainObservatory[d.id];
  const community = communityStats[d.id];
  return {
    id: d.id,
    slug: slugifyDomain(d.name),
    name: d.name,
    description: d.description,
    type: obs ? (typeMap[obs.type] ?? "STRATEGIC") : "STRATEGIC",
    observationObjective: obs?.objective ?? d.description,
    priorityIndicators: obs?.indicators ?? [],
    expectedPhenomena: obs?.phenomena.map((p) => p.title) ?? [],
    status: obs ? (statusMap[obs.status] ?? "ACTIVE") : "ACTIVE",
    projectCount: d.projectCount,
    participantCount: community?.participants ?? 0,
    discussionCount: community?.discussions ?? obs?.insights.length ?? 0,
    knowledgeCount: community?.insights ?? 0,
    phenomenonCount: obs?.phenomena.length ?? 0,
    engagementRate: obs?.engagement ?? 50,
    createdAt: "2026-01-01",
  };
});
