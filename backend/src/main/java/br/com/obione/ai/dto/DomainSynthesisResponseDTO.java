package br.com.obione.ai.dto;

import java.time.Instant;
import java.util.List;

/** API envelope for {@link DomainSynthesisDTO} with reproducibility metadata (RNF04). */
public record DomainSynthesisResponseDTO(
        String summary,
        List<String> patterns,
        List<String> lessons,
        Long suggestionId,
        String provider,
        String model,
        Instant generatedAt
) {
    public static DomainSynthesisResponseDTO of(
            DomainSynthesisDTO s, Long suggestionId, String provider, String model, Instant generatedAt) {
        return new DomainSynthesisResponseDTO(
                s.summary(), s.patterns(), s.lessons(),
                suggestionId, provider, model, generatedAt);
    }
}
