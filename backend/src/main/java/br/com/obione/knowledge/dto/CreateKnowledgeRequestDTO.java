package br.com.obione.knowledge.dto;

import br.com.obione.knowledge.enums.KnowledgeConfidence;
import br.com.obione.knowledge.enums.KnowledgeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateKnowledgeRequestDTO(
        @NotBlank String title,
        @NotBlank String summary,
        @NotNull Long domainId,
        Long projectId,
        Long discussionId,
        Long phenomenonId,
        String evidence,
        String recommendation,
        KnowledgeConfidence confidence,
        KnowledgeStatus status
) {
}
