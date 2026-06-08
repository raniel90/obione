package br.com.obione.permissions.controller;

import br.com.obione.permissions.dto.PermissionResponse;
import br.com.obione.permissions.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@Tag(name = "Permissions", description = "Catálogo de permissões do sistema")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @GetMapping
    @Operation(summary = "Listar todas as permissões")
    public List<PermissionResponse> listPermissions() {
        return permissionService.findAll();
    }
}
