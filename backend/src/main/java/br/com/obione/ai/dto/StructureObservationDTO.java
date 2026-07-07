package br.com.obione.ai.dto;

/**
 * AI-structured output for a free-text observation: a short title, the best-matching
 * MPO attribute id (must be a key from the MPO lens — validated by the service before
 * returning), and an initial interpretation. Structured-output record — LLM-generated only.
 */
public record StructureObservationDTO(
        String title,
        String attributeId,
        String interpretation
) {
}
