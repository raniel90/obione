package br.com.obione.governance.controller;

import br.com.obione.governance.dto.ProfilePermissionResponse;
import br.com.obione.governance.dto.UpdateProfilePermissionRequest;
import br.com.obione.governance.service.ProfilePermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/profile-permissions")
@Tag(name = "Governance", description = "Matriz de permissões por perfil")
public class ProfilePermissionController {

    private final ProfilePermissionService profilePermissionService;

    public ProfilePermissionController(ProfilePermissionService profilePermissionService) {
        this.profilePermissionService = profilePermissionService;
    }

    @GetMapping
    @Operation(summary = "Listar permissões por perfil")
    public List<ProfilePermissionResponse> listProfilePermissions() {
        return profilePermissionService.findAll();
    }

    @PutMapping
    @Operation(summary = "Atualizar permissão de um perfil")
    public ProfilePermissionResponse updateProfilePermission(
            @Valid @RequestBody UpdateProfilePermissionRequest request
    ) {
        return profilePermissionService.update(request);
    }
}
