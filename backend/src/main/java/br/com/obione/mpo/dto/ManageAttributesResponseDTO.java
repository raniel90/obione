package br.com.obione.mpo.dto;

import java.util.List;

public record ManageAttributesResponseDTO(
        List<String> added,
        List<String> removed,
        List<String> blocked
) {}
