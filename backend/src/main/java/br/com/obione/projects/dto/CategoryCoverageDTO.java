package br.com.obione.projects.dto;

/** Coverage of one MPO category: how many in-scope attributes have ≥1 observation. */
public record CategoryCoverageDTO(
        String key,
        String label,
        int total,
        int covered,
        int percentage
) {
}
