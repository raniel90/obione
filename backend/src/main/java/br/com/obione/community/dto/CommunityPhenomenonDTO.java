package br.com.obione.community.dto;

import br.com.obione.phenomena.enums.PhenomenonImpact;
import br.com.obione.phenomena.enums.PhenomenonStatus;
import br.com.obione.phenomena.enums.PhenomenonTrend;

public record CommunityPhenomenonDTO(
        Long id,
        String name,
        String description,
        PhenomenonStatus status,
        PhenomenonTrend trend,
        PhenomenonImpact impact,
        int evidenceCount
) {
}
