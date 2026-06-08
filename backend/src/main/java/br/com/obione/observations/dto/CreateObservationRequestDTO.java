package br.com.obione.observations.dto;

import br.com.obione.observations.enums.ObservationImpact;
import br.com.obione.observations.enums.ObservationStatus;
import br.com.obione.projects.enums.RiskLevel;
import jakarta.validation.constraints.NotBlank;

public record CreateObservationRequestDTO(
        @NotBlank String title,
        @NotBlank String description,
        String attributeId,
        String phenomenonId,
        ObservationImpact impact,
        RiskLevel risk,
        String interpretation,
        ObservationStatus status,
        Long createdById
) {
}
