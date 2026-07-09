package br.com.obione.knowledge.dto;

import br.com.obione.knowledge.enums.KnowledgeConfidence;
import jakarta.validation.constraints.NotBlank;

public record ConsolidateKnowledgeRequestDTO(
        @NotBlank String title,
        @NotBlank String summary,
        String evidence,
        String recommendation,
        KnowledgeConfidence confidence,
        Long suggestionId
) {
}
