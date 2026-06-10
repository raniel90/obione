package br.com.obione.ai.dto;

import jakarta.validation.constraints.NotBlank;

/** Input for the project-setup suggestion — pre-creation, so no project id yet. */
public record ProjectSetupRequestDTO(
        @NotBlank String name,
        @NotBlank String description,
        String observationObjective
) {
}
