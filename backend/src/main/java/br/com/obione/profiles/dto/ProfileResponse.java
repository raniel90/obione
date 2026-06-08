package br.com.obione.profiles.dto;

import br.com.obione.profiles.enums.ProfileCode;

public record ProfileResponse(
        Long id,
        ProfileCode code,
        String name,
        String description
) {
}
