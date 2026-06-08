package br.com.obione.auth.dto;

import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.users.enums.UserStatus;

public record CurrentUserDTO(
        Long id,
        String name,
        String email,
        ProfileCode profileCode,
        UserStatus status
) {
}
