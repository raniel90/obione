package br.com.obione.projects.dto;

import br.com.obione.projects.enums.ClientEngagement;
import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.ProjectType;
import br.com.obione.projects.enums.RiskLevel;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ProjectResponseDTO(
        Long id,
        String name,
        Long domainId,
        Long clientId,
        String clientName,
        Long consultantId,
        String consultantName,
        ProjectType type,
        ProjectStatus status,
        String summary,
        String observationObjective,
        List<String> initialAttributeIds,
        List<String> expectedPhenomena,
        int progress,
        RiskLevel riskLevel,
        ClientEngagement clientEngagement,
        LocalDate startDate,
        LocalDate expectedEndDate,
        String closureSummary,
        String lessonsLearned,
        String identifiedPatterns,
        String futureRecommendation,
        Instant createdAt,
        Instant updatedAt
) {
}
