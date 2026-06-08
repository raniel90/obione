package br.com.obione.knowledge.dto;

import br.com.obione.knowledge.enums.KnowledgeConfidence;
import br.com.obione.knowledge.enums.KnowledgeStatus;

import java.time.Instant;

public record KnowledgeResponseDTO(
        Long id,
        Long domainId,
        Long projectId,
        Long discussionId,
        Long phenomenonId,
        String title,
        String summary,
        String evidence,
        String recommendation,
        KnowledgeConfidence confidence,
        KnowledgeStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
