package br.com.obione.mpo.dto;

import br.com.obione.mpo.enums.AttributePhase;

public record MpoAttributeDTO(
        Long id,
        String code,
        String name,
        String description,
        AttributePhase phase,
        String categoryCode,
        String categoryName
) {}
