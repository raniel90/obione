package br.com.obione.observations.dto;

import br.com.obione.observations.enums.ObservationImpact;
import br.com.obione.observations.enums.ObservationStatus;
import br.com.obione.projects.enums.RiskLevel;

import java.time.Instant;

public record ObservationResponseDTO(
        Long id,
        Long projectId,
        String title,
        String description,
        String attributeId,
        String phenomenonId,
        ObservationImpact impact,
        RiskLevel risk,
        String interpretation,
        ObservationStatus status,
        Long createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {
}
