package br.com.obione.governance.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.governance.dto.ProfilePermissionResponse;
import br.com.obione.governance.dto.UpdateProfilePermissionRequest;
import br.com.obione.governance.entity.ProfilePermission;
import br.com.obione.governance.mapper.ProfilePermissionMapper;
import br.com.obione.governance.repository.ProfilePermissionRepository;
import br.com.obione.permissions.entity.Permission;
import br.com.obione.permissions.repository.PermissionRepository;
import br.com.obione.profiles.entity.Profile;
import br.com.obione.profiles.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfilePermissionService {

    private final ProfilePermissionRepository profilePermissionRepository;
    private final ProfileRepository profileRepository;
    private final PermissionRepository permissionRepository;

    public ProfilePermissionService(
            ProfilePermissionRepository profilePermissionRepository,
            ProfileRepository profileRepository,
            PermissionRepository permissionRepository
    ) {
        this.profilePermissionRepository = profilePermissionRepository;
        this.profileRepository = profileRepository;
        this.permissionRepository = permissionRepository;
    }

    @Transactional(readOnly = true)
    public List<ProfilePermissionResponse> findAll() {
        return profilePermissionRepository.findAll().stream()
                .map(ProfilePermissionMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProfilePermissionResponse update(UpdateProfilePermissionRequest request) {
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
