package br.com.obione.governance.dto;

import br.com.obione.profiles.enums.ProfileCode;

public record ProfilePermissionResponse(
        ProfileCode profileCode,
        String permissionCode,
        boolean enabled
) {
}
