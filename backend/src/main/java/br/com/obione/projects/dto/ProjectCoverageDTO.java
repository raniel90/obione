package br.com.obione.projects.dto;

import java.util.List;

/**
 * MPO coverage of a project: how much of the observation lens (44/8, in-scope)
 * is actually backed by at least one observation. The observatory's "Avaliar".
 */
public record ProjectCoverageDTO(
        int totalInScope,
        int covered,
        int percentage,
        List<CategoryCoverageDTO> categories
) {
}
