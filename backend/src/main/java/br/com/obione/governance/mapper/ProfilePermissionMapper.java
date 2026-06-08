package br.com.obione.governance.mapper;

import br.com.obione.governance.dto.ProfilePermissionResponse;
import br.com.obione.governance.entity.ProfilePermission;

public final class ProfilePermissionMapper {

    private ProfilePermissionMapper() {
    }

    public static ProfilePermissionResponse toResponse(ProfilePermission profilePermission) {
        return new ProfilePermissionResponse(
                profilePermission.getProfile().getCode(),
                profilePermission.getPermission().getCode(),
                profilePermission.isEnabled()
        );
    }
}
