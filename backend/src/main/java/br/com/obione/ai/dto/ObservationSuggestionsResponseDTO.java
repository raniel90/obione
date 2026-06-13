package br.com.obione.ai.dto;

import java.time.Instant;
import java.util.List;

/** API envelope for {@link ObservationSuggestionsDTO} with reproducibility metadata (RNF04). */
public record ObservationSuggestionsResponseDTO(
        List<ObservationSuggestionDTO> suggestions,
        Long suggestionId,
        String provider,
        String model,
        Instant generatedAt
) {
    public static ObservationSuggestionsResponseDTO of(
            ObservationSuggestionsDTO s, Long suggestionId, String provider, String model, Instant generatedAt) {
        return new ObservationSuggestionsResponseDTO(s.suggestions(), suggestionId, provider, model, generatedAt);
    }
}
