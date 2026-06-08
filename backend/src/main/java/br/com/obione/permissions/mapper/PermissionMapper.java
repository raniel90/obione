package br.com.obione.permissions.mapper;

import br.com.obione.permissions.dto.PermissionResponse;
import br.com.obione.permissions.entity.Permission;

public final class PermissionMapper {

    private PermissionMapper() {
    }

    public static PermissionResponse toResponse(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getCode(),
                permission.getName(),
                permission.getDescription(),
                permission.getCategory()
        );
    }
}
