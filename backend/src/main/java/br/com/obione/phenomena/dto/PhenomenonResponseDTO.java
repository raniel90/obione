package br.com.obione.phenomena.dto;

import br.com.obione.phenomena.enums.PhenomenonImpact;
import br.com.obione.phenomena.enums.PhenomenonStatus;
import br.com.obione.phenomena.enums.PhenomenonTrend;

import java.time.Instant;
import java.util.List;

public record PhenomenonResponseDTO(
        Long id,
        Long domainId,
        Long projectId,
        String name,
        String description,
        int evidenceCount,
        List<String> relatedAttributeIds,
        PhenomenonImpact impact,
        PhenomenonTrend trend,
        PhenomenonStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
