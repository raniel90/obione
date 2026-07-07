package br.com.obione.ai.dto;

import jakarta.validation.constraints.NotBlank;

/** Input for the observation-structuring assistant — a free-text description from the consultant. */
public record StructureObservationRequestDTO(
        @NotBlank String description
) {
}
