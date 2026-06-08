package br.com.obione.discussions.dto;

import br.com.obione.discussions.enums.DiscussionStatus;
import br.com.obione.discussions.enums.DiscussionVisibility;

import java.time.Instant;
import java.util.List;

public record DiscussionResponseDTO(
        Long id,
        Long domainId,
        Long projectId,
        Long phenomenonId,
        Long observationId,
        String title,
        String question,
        DiscussionStatus status,
        DiscussionVisibility visibility,
        Long createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt,
        List<DiscussionContributionResponseDTO> contributions
) {
}
