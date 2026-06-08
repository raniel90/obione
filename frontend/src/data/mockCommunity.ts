import type { CommunityOverview, DomainCommunitySummary, CommunityParticipant } from "@/types/community";
import { communityKpis, domainCommunities, participants } from "@/lib/community-data";
import { mockDomains } from "./mockDomains";
import { slugifyDomain } from "@/lib/community-utils";

export const mockCommunityOverview: CommunityOverview = {
  activeCommunities: communityKpis.activeCommunities,
  authorizedParticipants: communityKpis.authorizedParticipants,
  observationalDiscussions: communityKpis.observationalDiscussions,
  collaborativeInsights: communityKpis.collaborativeInsights,
  recentContributions: communityKpis.recentContributions,
};

const statusMap = {
  ativa: "ACTIVE",
  monitorada: "MONITORED",
  "em-formação": "FORMING",
} as const;

export const mockDomainCommunities: DomainCommunitySummary[] = domainCommunities.map((c) => ({
  id: c.id,
  domainId: c.domainId,
  domainSlug: slugifyDomain(c.domain),
  domainName: c.domain,
  description: c.description,
  participants: c.participants,
  linkedProjects: c.linkedProjects,
  discussions: c.discussions,
  insights: c.insights,
  status: statusMap[c.status],
}));

const roleMap = { admin: "ADMIN", consultor: "CONSULTANT", cliente: "CLIENT" } as const;
const pStatusMap = { ativo: "ACTIVE", convidado: "INVITED", "aguardando-validação": "PENDING" } as const;

export const mockCommunityParticipants: CommunityParticipant[] = participants.map((p) => {
  const dom = mockDomains.find((d) => p.domain?.includes(d.name));
  return {
    id: p.id,
    userId: p.id,
    domainId: dom?.id ?? "",
    name: p.name,
    role: roleMap[p.role],
    participation: p.participation,
    status: pStatusMap[p.status],
  };
});
