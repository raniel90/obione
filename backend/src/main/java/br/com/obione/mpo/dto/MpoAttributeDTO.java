package br.com.obione.mpo.dto;

import br.com.obione.mpo.enums.AttributePhase;
import br.com.obione.mpo.enums.FillMode;

public record MpoAttributeDTO(
        Long id,
        String code,
        String name,
        String description,
        AttributePhase phase,
        FillMode fillMode,
        String categoryCode,
        String categoryName
) {}
