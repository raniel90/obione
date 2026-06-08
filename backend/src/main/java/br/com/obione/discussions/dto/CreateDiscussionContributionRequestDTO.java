package br.com.obione.discussions.dto;

import br.com.obione.discussions.enums.ContributionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDiscussionContributionRequestDTO(
        @NotNull ContributionType type,
        @NotBlank String text,
        Long userId
) {
}
