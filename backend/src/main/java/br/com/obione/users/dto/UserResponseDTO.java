package br.com.obione.users.dto;

import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.users.enums.UserStatus;

import java.time.Instant;
import java.util.List;

public record UserResponseDTO(
        Long id,
        String name,
        String email,
        ProfileCode profileCode,
        UserStatus status,
        List<String> domainIds,
        List<String> projectIds,
        Instant createdAt,
        Instant updatedAt
) {
}
