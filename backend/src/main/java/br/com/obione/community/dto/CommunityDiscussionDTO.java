package br.com.obione.community.dto;

import br.com.obione.discussions.enums.DiscussionStatus;
import br.com.obione.discussions.enums.DiscussionVisibility;

import java.time.Instant;

public record CommunityDiscussionDTO(
        Long id,
        Long domainId,
        String domainSlug,
        String domainName,
        String title,
        String question,
        DiscussionStatus status,
        DiscussionVisibility visibility,
        Long projectId,
        String projectName,
        Long phenomenonId,
        String phenomenonName,
        int contributionsCount,
        Instant createdAt
) {
}
