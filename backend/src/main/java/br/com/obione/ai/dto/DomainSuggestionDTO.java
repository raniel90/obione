package br.com.obione.ai.dto;

/** AI suggestion of a project's domain/theme (the "categorizadora" role). */
public record DomainSuggestionDTO(
        String suggestedDomainSlug,
        double confidence,
        String rationale
) {
}
