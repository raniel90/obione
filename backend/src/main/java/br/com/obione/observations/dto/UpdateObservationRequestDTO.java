package br.com.obione.observations.dto;

import br.com.obione.observations.enums.ObservationImpact;
import br.com.obione.observations.enums.ObservationStatus;
import br.com.obione.projects.enums.RiskLevel;

public record UpdateObservationRequestDTO(
        String title,
        String description,
        Long mpoAttributeId,
        String attributeId,
        String phenomenonId,
        ObservationImpact impact,
        RiskLevel risk,
        String interpretation,
        ObservationStatus status,
        Long createdById
) {
}
