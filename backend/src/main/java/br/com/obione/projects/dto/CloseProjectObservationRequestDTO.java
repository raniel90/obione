package br.com.obione.projects.dto;

public record CloseProjectObservationRequestDTO(
        String closureSummary,
        String lessonsLearned,
        String identifiedPatterns,
        String futureRecommendation
) {
}
