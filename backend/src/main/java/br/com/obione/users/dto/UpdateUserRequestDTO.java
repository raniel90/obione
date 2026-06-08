package br.com.obione.users.dto;

import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.users.enums.UserStatus;

import java.util.List;

public record UpdateUserRequestDTO(
        String name,
        String email,
        String password,
        ProfileCode profileCode,
        UserStatus status,
        List<String> domainIds,
        List<String> projectIds
) {
}
