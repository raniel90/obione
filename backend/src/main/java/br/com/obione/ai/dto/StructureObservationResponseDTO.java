package br.com.obione.ai.dto;

import java.time.Instant;

/** API envelope for {@link StructureObservationDTO} with reproducibility metadata (RNF04). */
public record StructureObservationResponseDTO(
        String title,
        String attributeId,
        String interpretation,
        Long suggestionId,
        String provider,
        String model,
        Instant generatedAt
) {
    public static StructureObservationResponseDTO of(
            StructureObservationDTO s,
            Long suggestionId, String provider, String model, Instant generatedAt) {
        return new StructureObservationResponseDTO(
                s.title(), s.attributeId(), s.interpretation(),
                suggestionId, provider, model, generatedAt);
    }
}
