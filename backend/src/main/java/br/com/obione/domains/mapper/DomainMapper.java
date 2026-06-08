package br.com.obione.domains.mapper;

import br.com.obione.domains.dto.DomainResponseDTO;
import br.com.obione.domains.entity.Domain;

import java.util.ArrayList;
import java.util.List;

public final class DomainMapper {

    private DomainMapper() {
    }

    public static DomainResponseDTO toResponseDTO(Domain domain) {
        return new DomainResponseDTO(
                domain.getId(),
                domain.getSlug(),
                domain.getName(),
                domain.getDescription(),
                domain.getType(),
                domain.getObservationObjective(),
                copyList(domain.getPriorityIndicators()),
                copyList(domain.getExpectedPhenomena()),
                domain.getStatus(),
                domain.getProjectCount(),
                domain.getParticipantCount(),
                domain.getDiscussionCount(),
                domain.getKnowledgeCount(),
                domain.getPhenomenonCount(),
                domain.getEngagementRate(),
                domain.getCreatedAt(),
                domain.getUpdatedAt()
        );
    }

    public static List<String> copyList(List<String> source) {
        return source == null ? new ArrayList<>() : new ArrayList<>(source);
    }
}
