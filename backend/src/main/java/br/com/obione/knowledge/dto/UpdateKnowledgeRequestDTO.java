package br.com.obione.knowledge.dto;

import br.com.obione.knowledge.enums.KnowledgeConfidence;
import br.com.obione.knowledge.enums.KnowledgeStatus;

public record UpdateKnowledgeRequestDTO(
        String title,
        String summary,
        Long domainId,
        Long projectId,
        Long discussionId,
        Long phenomenonId,
        String evidence,
        String recommendation,
        KnowledgeConfidence confidence,
        KnowledgeStatus status
) {
}
