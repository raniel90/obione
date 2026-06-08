package br.com.obione.users.dto;

import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.users.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateUserRequestDTO(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotNull ProfileCode profileCode,
        @NotNull UserStatus status,
        List<String> domainIds,
        List<String> projectIds
) {
}
