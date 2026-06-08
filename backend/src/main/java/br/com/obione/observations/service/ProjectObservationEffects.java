package br.com.obione.observations.service;

import br.com.obione.projects.entity.Project;
import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.RiskLevel;

import java.time.Instant;

public final class ProjectObservationEffects {

    private ProjectObservationEffects() {
    }

    public static void apply(Project project, RiskLevel observationRisk) {
        project.setUpdatedAt(Instant.now());

        if (project.getStatus() == ProjectStatus.CLOSED) {
            return;
        }

        project.setRiskLevel(escalateRisk(project.getRiskLevel(), observationRisk));

        if (observationRisk == RiskLevel.HIGH || observationRisk == RiskLevel.CRITICAL) {
            project.setStatus(ProjectStatus.RISK);
        }
    }

    static RiskLevel escalateRisk(RiskLevel current, RiskLevel observationRisk) {
        return switch (observationRisk) {
            case CRITICAL -> maxRisk(current, RiskLevel.CRITICAL);
            case HIGH -> maxRisk(current, RiskLevel.HIGH);
            case MODERATE -> current == RiskLevel.LOW ? RiskLevel.MODERATE : current;
            case LOW -> current;
        };
    }

    private static RiskLevel maxRisk(RiskLevel a, RiskLevel b) {
        return a.ordinal() >= b.ordinal() ? a : b;
    }
}
