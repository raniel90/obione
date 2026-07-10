package br.com.obione.governance.service;

import br.com.obione.common.exception.BadRequestException;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.exception.UnauthorizedException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.governance.dto.ProfilePermissionResponse;
import br.com.obione.governance.dto.UpdateProfilePermissionRequest;
import br.com.obione.governance.entity.ProfilePermission;
import br.com.obione.governance.mapper.ProfilePermissionMapper;
import br.com.obione.governance.repository.ProfilePermissionRepository;
import br.com.obione.permissions.entity.Permission;
import br.com.obione.permissions.repository.PermissionRepository;
import br.com.obione.profiles.entity.Profile;
import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.profiles.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfilePermissionService {

    private final ProfilePermissionRepository profilePermissionRepository;
    private final ProfileRepository profileRepository;
    private final PermissionRepository permissionRepository;
    private final CurrentUser currentUser;

    public ProfilePermissionService(
            ProfilePermissionRepository profilePermissionRepository,
            ProfileRepository profileRepository,
            PermissionRepository permissionRepository,
            CurrentUser currentUser
    ) {
        this.profilePermissionRepository = profilePermissionRepository;
        this.profileRepository = profileRepository;
        this.permissionRepository = permissionRepository;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<ProfilePermissionResponse> findAll() {
        return profilePermissionRepository.findAll().stream()
                .map(ProfilePermissionMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProfilePermissionResponse update(UpdateProfilePermissionRequest request) {
        // Governance rules: ADMIN permissions are fixed (all enabled); only an
        // admin may change CONSULTANT permissions; consultants manage CLIENT only.
        if (request.profileCode() == ProfileCode.ADMIN) {
            throw new BadRequestException(
                    "As permissões do administrador são fixas e não podem ser alteradas");
        }
        if (request.profileCode() == ProfileCode.CONSULTANT && !currentUser.hasRole("ADMIN")) {
            throw new UnauthorizedException(
                    "Apenas o administrador altera as permissões do consultor");
        }
        ProfilePermission profilePermission = profilePermissionRepository
                .findByProfile_CodeAndPermission_Code(request.profileCode(), request.permissionCode())
                .orElseGet(() -> createProfilePermission(request.profileCode(), request.permissionCode()));

        profilePermission.setEnabled(request.enabled());
        ProfilePermission saved = profilePermissionRepository.save(profilePermission);
        return ProfilePermissionMapper.toResponse(saved);
    }

    private ProfilePermission createProfilePermission(
            br.com.obione.profiles.enums.ProfileCode profileCode,
            String permissionCode
    ) {
        Profile profile = profileRepository.findByCode(profileCode)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + profileCode));

        Permission permission = permissionRepository.findByCode(permissionCode)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão não encontrada: " + permissionCode));

        return ProfilePermission.builder()
                .profile(profile)
                .permission(permission)
                .enabled(false)
                .build();
    }
}
