package br.com.obione.ai.dto;

import java.util.List;

/** Wrapper so structured output maps cleanly to a JSON object with a list. */
public record ObservationSuggestionsDTO(
        List<ObservationSuggestionDTO> suggestions
) {
}
