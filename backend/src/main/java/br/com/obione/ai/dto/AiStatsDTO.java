package br.com.obione.ai.dto;

import br.com.obione.ai.enums.AiSuggestionType;

import java.util.List;

/**
 * Acceptance metrics derived from {@code ai_suggestion_logs} — never stored.
 * Only types with an acceptance flow (OBSERVATIONS, PROJECT_SETUP) accrue
 * {@code accepted}; the others stay at 0 by construction.
 */
public record AiStatsDTO(
        long totalSuggestions,
        long totalAccepted,
        List<AiTypeStatsDTO> byType
) {
    public record AiTypeStatsDTO(
            AiSuggestionType type,
            long total,
            long accepted,
            int acceptanceRatePercent
    ) {
    }
}
