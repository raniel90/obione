package br.com.obione.projects.dto;

import br.com.obione.projects.enums.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateProjectStatusRequestDTO(
        @NotNull ProjectStatus status,
        String note
) {
}
