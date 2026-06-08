package br.com.obione.governance.dto;

import br.com.obione.profiles.enums.ProfileCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateProfilePermissionRequest(
        @NotNull ProfileCode profileCode,
        @NotBlank String permissionCode,
        @NotNull Boolean enabled
) {
}
