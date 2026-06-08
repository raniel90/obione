package br.com.obione.profiles.controller;

import br.com.obione.profiles.dto.ProfileResponse;
import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.profiles.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/profiles")
@Tag(name = "Profiles", description = "Gestão de perfis de acesso")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(summary = "Listar todos os perfis")
    public List<ProfileResponse> listProfiles() {
        return profileService.findAll();
    }

    @GetMapping("/{code}")
    @Operation(summary = "Buscar perfil por código")
    public ProfileResponse getProfile(@PathVariable ProfileCode code) {
        return profileService.findByCode(code);
    }
}
