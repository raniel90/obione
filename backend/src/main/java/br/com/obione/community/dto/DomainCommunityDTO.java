package br.com.obione.community.dto;

import br.com.obione.domains.enums.DomainStatus;

import java.util.List;

public record DomainCommunityDTO(
        Long domainId,
        String domainSlug,
        String domainName,
        String description,
        DomainStatus status,
        int participantCount,
        int projectCount,
        int discussionCount,
        int knowledgeCount,
        int phenomenonCount,
        int contributionCount,
        List<CommunityParticipantDTO> participants,
        List<CommunityProjectDTO> projects,
        List<CommunityDiscussionDTO> discussions,
        List<CommunityKnowledgeDTO> knowledge,
        List<CommunityPhenomenonDTO> topPhenomena
) {
}
