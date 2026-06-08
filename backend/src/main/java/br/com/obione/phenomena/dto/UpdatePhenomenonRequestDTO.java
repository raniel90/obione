package br.com.obione.phenomena.dto;

import br.com.obione.phenomena.enums.PhenomenonImpact;
import br.com.obione.phenomena.enums.PhenomenonStatus;
import br.com.obione.phenomena.enums.PhenomenonTrend;

import java.util.List;

public record UpdatePhenomenonRequestDTO(
        String name,
        Long domainId,
        Long projectId,
        String description,
        Integer evidenceCount,
        List<String> relatedAttributeIds,
        PhenomenonImpact impact,
        PhenomenonTrend trend,
        PhenomenonStatus status
) {
}
