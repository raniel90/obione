package br.com.obione.discussions.dto;

import br.com.obione.discussions.enums.DiscussionStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDiscussionStatusRequestDTO(
        @NotNull DiscussionStatus status
) {
}
