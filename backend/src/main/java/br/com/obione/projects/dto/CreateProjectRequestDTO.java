package br.com.obione.projects.dto;

import br.com.obione.projects.enums.ClientEngagement;
import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.ProjectType;
import br.com.obione.projects.enums.RiskLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateProjectRequestDTO(
        @NotBlank String name,
        @NotNull Long domainId,
        Long clientId,
        Long consultantId,
        @NotNull ProjectType type,
        ProjectStatus status,
        String summary,
        String observationObjective,
        List<String> initialAttributeIds,
        List<String> expectedPhenomena,
        @Min(0) @Max(100) Integer progress,
        RiskLevel riskLevel,
        ClientEngagement clientEngagement,
        LocalDate startDate,
        LocalDate expectedEndDate
) {
}
