package br.com.obione.projects.mapper;

import br.com.obione.projects.dto.ProjectResponseDTO;
import br.com.obione.projects.entity.Project;

import java.util.ArrayList;
import java.util.List;

public final class ProjectMapper {

    private ProjectMapper() {
    }

    public static ProjectResponseDTO toResponseDTO(Project project) {
        return new ProjectResponseDTO(
                project.getId(),
                project.getName(),
                project.getDomain().getId(),
                project.getClient() != null ? project.getClient().getId() : null,
                project.getClient() != null ? project.getClient().getName() : null,
                project.getConsultant() != null ? project.getConsultant().getId() : null,
                project.getConsultant() != null ? project.getConsultant().getName() : null,
                project.getType(),
                project.getStatus(),
                project.getSummary(),
                project.getObservationObjective(),
                copyList(project.getInitialAttributeIds()),
                copyList(project.getExpectedPhenomena()),
                project.getProgress(),
                project.getRiskLevel(),
                project.getClientEngagement(),
                project.getStartDate(),
                project.getExpectedEndDate(),
                project.getClosureSummary(),
                project.getLessonsLearned(),
                project.getIdentifiedPatterns(),
                project.getFutureRecommendation(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    public static List<String> copyList(List<String> source) {
        return source == null ? new ArrayList<>() : new ArrayList<>(source);
    }
}
