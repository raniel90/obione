package br.com.obione.mpo.dto;

import java.util.List;

/** One of the 8 MPO categories with its attributes. */
public record MpoCategoryDTO(
        String key,
        String label,
        int order,
        List<MpoAttributeDTO> attributes
) {
}
