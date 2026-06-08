package br.com.obione.community.dto;

import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.RiskLevel;

public record CommunityProjectDTO(
        Long id,
        String name,
        ProjectStatus status,
        RiskLevel riskLevel,
        int progress,
        String clientName,
        String consultantName
) {
}
