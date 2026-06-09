package br.com.obione.ai.dto;

/**
 * AI-suggested observation, mapped to the MPO lens (the "observadora assistida").
 * {@code attributeId} is a canonical MPO attribute key; {@code impact} is LOW/MEDIUM/HIGH.
 */
public record ObservationSuggestionDTO(
        String title,
        String description,
        String attributeId,
        String impact
) {
}
