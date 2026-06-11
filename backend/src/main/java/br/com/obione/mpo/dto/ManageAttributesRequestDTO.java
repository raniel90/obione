package br.com.obione.mpo.dto;

import java.util.List;

public record ManageAttributesRequestDTO(
        List<String> add,
        List<String> remove,
        boolean force
) {}
