import type {
  CommunityOverviewResponse,
  CommunityParticipant,
  DomainCommunityDetail,
  DomainCommunitySummary,
} from "@/types/community";
import {
  mockCommunityOverview,
  mockCommunityParticipants,
  mockDomainCommunities,
} from "@/data/mockCommunity";
import { delay, request } from "./apiClient";
import {
  type ApiCommunityOverview,
  type ApiDomainCommunity,
  mapCommunityOverview,
  mapDomainCommunityDetail,
} from "./apiMappers";

export async function getCommunityOverview(): Promise<CommunityOverviewResponse> {
  try {
    const data = await request<ApiCommunityOverview>("/community");
    return mapCommunityOverview(data);
  } catch {
    return delay({
      overview: { ...mockCommunityOverview },
      domains: [...mockDomainCommunities],
      recentDiscussions: [],
      recentKnowledge: [],
    });
  }
}

export async function getCommunityByDomainSlug(
  slug: string,
): Promise<DomainCommunityDetail | null> {
  try {
    const data = await request<ApiDomainCommunity>(`/community/domains/slug/${slug}`);
    return mapDomainCommunityDetail(data);
  } catch {
    const summary = mockDomainCommunities.find((c) => c.domainSlug === slug);
    if (!summary) return delay(null);
    return delay({
      ...summary,
      phenomenonCount: 0,
      contributionCount: 0,
      participantsList: mockCommunityParticipants.filter((p) => p.domainId === summary.domainId),
      projects: [],
      discussions: [],
      knowledge: [],
      topPhenomena: [],
    });
  }
}

export async function getCommunityByDomainId(
  domainId: string,
): Promise<DomainCommunityDetail | null> {
  try {
    const data = await request<ApiDomainCommunity>(`/community/domains/${domainId}`);
    return mapDomainCommunityDetail(data);
  } catch {
    const summary = mockDomainCommunities.find((c) => c.domainId === domainId);
    if (!summary) return delay(null);
    return delay({
      ...summary,
      phenomenonCount: 0,
      contributionCount: 0,
      participantsList: mockCommunityParticipants.filter((p) => p.domainId === summary.domainId),
      projects: [],
      discussions: [],
      knowledge: [],
      topPhenomena: [],
    });
  }
}

export async function getCommunityParticipantsByDomain(
  domainId: string,
): Promise<CommunityParticipant[]> {
  const community = await getCommunityByDomainId(domainId);
  return community?.participantsList ?? [];
}

export async function getCommunityStatsByDomain(domainId: string): Promise<{
  participants: number;
  linkedProjects: number;
  discussions: number;
  insights: number;
} | null> {
  const community = await getCommunityByDomainId(domainId);
  if (!community) return null;
  return {
    participants: community.participants,
    linkedProjects: community.linkedProjects,
    discussions: community.discussions,
    insights: community.insights,
  };
}

export type { DomainCommunitySummary };
