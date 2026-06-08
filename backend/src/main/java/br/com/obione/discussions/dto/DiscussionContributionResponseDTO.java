package br.com.obione.discussions.dto;

import br.com.obione.discussions.enums.ContributionType;

import java.time.Instant;

public record DiscussionContributionResponseDTO(
        Long id,
        Long discussionId,
        Long userId,
        String userName,
        ContributionType type,
        String text,
        Instant createdAt
) {
}
