package br.com.obione.mpo.dto;

import java.util.List;

public record MpoCategoryDTO(
        Long id,
        String code,
        String name,
        int orderIndex,
        List<MpoAttributeDTO> attributes
) {}
