package br.com.obione.knowledge.mapper;

import br.com.obione.knowledge.dto.KnowledgeResponseDTO;
import br.com.obione.knowledge.entity.Knowledge;

public final class KnowledgeMapper {

    private KnowledgeMapper() {
    }

    public static KnowledgeResponseDTO toResponseDTO(Knowledge knowledge) {
        return new KnowledgeResponseDTO(
                knowledge.getId(),
                knowledge.getDomain().getId(),
                knowledge.getProject() != null ? knowledge.getProject().getId() : null,
                knowledge.getDiscussion() != null ? knowledge.getDiscussion().getId() : null,
                knowledge.getPhenomenon() != null ? knowledge.getPhenomenon().getId() : null,
                knowledge.getTitle(),
                knowledge.getSummary(),
                knowledge.getEvidence(),
                knowledge.getRecommendation(),
                knowledge.getConfidence(),
                knowledge.getStatus(),
                knowledge.getCreatedAt(),
                knowledge.getUpdatedAt()
        );
    }
}
