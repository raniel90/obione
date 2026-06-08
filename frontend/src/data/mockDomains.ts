import type { Domain, DomainTypeCode, DomainStatusCode } from "@/types/domain";
import { domains as legacyDomains } from "@/lib/mock-data";
import { domainObservatory } from "@/lib/domain-observatory";
import { domainCommunities } from "@/lib/community-data";
import { slugifyDomain } from "@/lib/community-utils";

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
  const community = domainCommunities.find((c) => c.domainId === d.id);
  return {
    id: d.id,
    slug: slugifyDomain(d.name),
    name: d.name,
    description: d.description,
    type: obs ? typeMap[obs.type] ?? "STRATEGIC" : "STRATEGIC",
    observationObjective: obs?.objective ?? d.description,
    priorityIndicators: obs?.indicators ?? [],
    expectedPhenomena: obs?.phenomena.map((p) => p.title) ?? [],
    status: obs ? statusMap[obs.status] ?? "ACTIVE" : "ACTIVE",
    projectCount: d.projectCount,
    participantCount: community?.participants ?? 0,
    discussionCount: community?.discussions ?? obs?.insights.length ?? 0,
    knowledgeCount: community?.insights ?? 0,
    phenomenonCount: obs?.phenomena.length ?? 0,
    engagementRate: obs?.engagement ?? 50,
    createdAt: "2026-01-01",
  };
});
