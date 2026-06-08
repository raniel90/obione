package br.com.obione.domains.dto;

import br.com.obione.domains.enums.DomainStatus;
import br.com.obione.domains.enums.DomainType;

import java.time.Instant;
import java.util.List;

public record DomainResponseDTO(
        Long id,
        String slug,
        String name,
        String description,
        DomainType type,
        String observationObjective,
        List<String> priorityIndicators,
        List<String> expectedPhenomena,
        DomainStatus status,
        int projectCount,
        int participantCount,
        int discussionCount,
        int knowledgeCount,
        int phenomenonCount,
        double engagementRate,
        Instant createdAt,
        Instant updatedAt
) {
}
