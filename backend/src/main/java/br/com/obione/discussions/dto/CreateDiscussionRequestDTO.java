package br.com.obione.discussions.dto;

import br.com.obione.discussions.enums.DiscussionStatus;
import br.com.obione.discussions.enums.DiscussionVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDiscussionRequestDTO(
        @NotBlank String title,
        @NotBlank String question,
        @NotNull Long domainId,
        Long projectId,
        Long phenomenonId,
        Long observationId,
        DiscussionStatus status,
        DiscussionVisibility visibility,
        Long createdById
) {
}
