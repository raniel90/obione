package br.com.obione.community.dto;

import java.util.List;

public record CommunityOverviewDTO(
        long totalDomains,
        long totalParticipants,
        long totalDiscussions,
        long totalKnowledge,
        long totalContributions,
        long activeCommunities,
        List<DomainCommunityDTO> domainCommunities,
        List<CommunityDiscussionDTO> recentDiscussions,
        List<CommunityKnowledgeDTO> recentKnowledge
) {
}
