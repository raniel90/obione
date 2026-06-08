package br.com.obione.community.dto;

import br.com.obione.knowledge.enums.KnowledgeConfidence;
import br.com.obione.knowledge.enums.KnowledgeStatus;

import java.time.Instant;

public record CommunityKnowledgeDTO(
        Long id,
        Long domainId,
        String domainSlug,
        String domainName,
        String title,
        String summary,
        String recommendation,
        KnowledgeConfidence confidence,
        KnowledgeStatus status,
        Long projectId,
        String projectName,
        Long phenomenonId,
        String phenomenonName,
        Instant createdAt
) {
}
