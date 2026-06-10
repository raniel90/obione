package br.com.obione.ai.dto;

import java.time.Instant;
import java.util.List;

/** API envelope for {@link ProjectSetupSuggestionDTO} with reproducibility metadata (RNF04). */
public record ProjectSetupSuggestionResponseDTO(
        String suggestedDomainSlug,
        Long suggestedDomainId,
        double confidence,
        List<String> attributeIds,
        List<String> expectedPhenomena,
        String rationale,
        Long suggestionId,
        String provider,
        String model,
        Instant generatedAt
) {
    public static ProjectSetupSuggestionResponseDTO of(
            ProjectSetupSuggestionDTO s, Long suggestedDomainId,
            Long suggestionId, String provider, String model, Instant generatedAt) {
        return new ProjectSetupSuggestionResponseDTO(
                s.suggestedDomainSlug(), suggestedDomainId, s.confidence(),
                s.attributeIds(), s.expectedPhenomena(), s.rationale(),
                suggestionId, provider, model, generatedAt);
    }
}
