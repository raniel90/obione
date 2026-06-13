package br.com.obione.ai.dto;

import java.time.Instant;

/**
 * API envelope for {@link DomainSuggestionDTO} with reproducibility metadata
 * (RNF04). Metadata lives outside the structured-output record so the LLM is
 * never asked to invent it.
 */
public record DomainSuggestionResponseDTO(
        String suggestedDomainSlug,
        double confidence,
        String rationale,
        Long suggestionId,
        String provider,
        String model,
        Instant generatedAt
) {
    public static DomainSuggestionResponseDTO of(
            DomainSuggestionDTO s, Long suggestionId, String provider, String model, Instant generatedAt) {
        return new DomainSuggestionResponseDTO(
                s.suggestedDomainSlug(), s.confidence(), s.rationale(),
                suggestionId, provider, model, generatedAt);
    }
}
