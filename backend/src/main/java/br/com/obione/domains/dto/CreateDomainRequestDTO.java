package br.com.obione.domains.dto;

import br.com.obione.domains.enums.DomainStatus;
import br.com.obione.domains.enums.DomainType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateDomainRequestDTO(
        @NotBlank String name,
        @NotNull DomainType type,
        String description,
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
