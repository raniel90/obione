package br.com.obione.ai.dto;

import java.time.Instant;

/** API envelope for {@link KnowledgeDraftDTO} with reproducibility metadata (RNF04). */
public record KnowledgeDraftResponseDTO(
        String title,
        String summary,
        String evidence,
        String recommendation,
        String confidence,
        Long suggestionId,
        String provider,
        String model,
        Instant generatedAt
) {
    public static KnowledgeDraftResponseDTO of(
            KnowledgeDraftDTO d, Long suggestionId, String provider, String model, Instant generatedAt) {
        return new KnowledgeDraftResponseDTO(
                d.title(), d.summary(), d.evidence(), d.recommendation(), d.confidence(),
                suggestionId, provider, model, generatedAt);
    }
}
