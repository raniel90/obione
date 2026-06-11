package br.com.obione.mpo.dto;

import br.com.obione.mpo.enums.AttributePhase;
import br.com.obione.mpo.enums.AttributeStatus;

import java.time.Instant;

public record ProjectAttributeValueDTO(
        Long id,
        String attributeCode,
        String attributeName,
        String attributeDescription,
        AttributePhase phase,
        String categoryCode,
        String categoryName,
        String currentValue,
        AttributeStatus status,
        Long lastObservationId,
        String updatedBy,
        Instant updatedAt
) {}
