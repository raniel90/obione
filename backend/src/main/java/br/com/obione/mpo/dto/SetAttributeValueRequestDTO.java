package br.com.obione.mpo.dto;

import br.com.obione.mpo.enums.AttributeStatus;
import jakarta.validation.constraints.NotNull;

public record SetAttributeValueRequestDTO(
        String value,
        @NotNull AttributeStatus status,
        String updatedBy
) {}
