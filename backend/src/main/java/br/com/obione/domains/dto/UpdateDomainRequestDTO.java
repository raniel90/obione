package br.com.obione.domains.dto;

import br.com.obione.domains.enums.DomainStatus;
import br.com.obione.domains.enums.DomainType;

import java.util.List;

public record UpdateDomainRequestDTO(
        String name,
        String description,
        DomainType type,
        String observationObjective,
        List<String> priorityIndicators,
        List<String> expectedPhenomena,
        DomainStatus status,
        Integer projectCount,
        Integer participantCount,
        Integer discussionCount,
        Integer knowledgeCount,
        Integer phenomenonCount,
        Double engagementRate
) {
}
