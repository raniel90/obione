package br.com.obione.governance.seed;

import br.com.obione.governance.entity.ProfilePermission;
import br.com.obione.governance.repository.ProfilePermissionRepository;
import br.com.obione.permissions.entity.Permission;
import br.com.obione.permissions.repository.PermissionRepository;
import br.com.obione.profiles.entity.Profile;
import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.profiles.repository.ProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@Order(1)
public class GovernanceDataSeeder implements CommandLineRunner {

    private final ProfileRepository profileRepository;
    private final PermissionRepository permissionRepository;
    private final ProfilePermissionRepository profilePermissionRepository;

    public GovernanceDataSeeder(
            ProfileRepository profileRepository,
            PermissionRepository permissionRepository,
            ProfilePermissionRepository profilePermissionRepository
    ) {
        this.profileRepository = profileRepository;
        this.permissionRepository = permissionRepository;
        this.profilePermissionRepository = profilePermissionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (profileRepository.count() > 0) {
            return;
        }

        Map<ProfileCode, Profile> profiles = seedProfiles();
        Map<String, Permission> permissions = seedPermissions();
        seedProfilePermissions(profiles, permissions);
    }

    private Map<ProfileCode, Profile> seedProfiles() {
        List<Profile> profiles = List.of(
                Profile.builder()
                        .code(ProfileCode.ADMIN)
                        .name("Administrador")
                        .description("Configura governança, perfis, permissões e domínios do observatório.")
                        .build(),
                Profile.builder()
                        .code(ProfileCode.CONSULTANT)
                        .name("Consultor")
                        .description("Conduz projetos, registra observações e participa de discussões observacionais.")
                        .build(),
                Profile.builder()
                        .code(ProfileCode.CLIENT)
                        .name("Cliente")
                        .description("Acompanha projetos contratados, valida entregas e contribui com feedbacks.")
                        .build()
        );

        return profileRepository.saveAll(profiles).stream()
                .collect(() -> new EnumMap<>(ProfileCode.class),
                        (map, profile) -> map.put(profile.getCode(), profile),
                        EnumMap::putAll);
    }

    private Map<String, Permission> seedPermissions() {
        List<Permission> permissions = List.of(
                permission("VIEW_OBSERVATORY", "Visualizar observatório", "Permite acessar o dashboard global do observatório.", "Observatório"),
                permission("VIEW_PROJECTS", "Visualizar projetos", "Permite visualizar projetos vinculados ao usuário.", "Projetos"),
                permission("CREATE_PROJECT", "Criar projeto", "Permite criar novos projetos no observatório.", "Projetos"),
                permission("EDIT_PROJECT", "Editar projeto", "Permite editar projetos existentes.", "Projetos"),
                permission("CLOSE_PROJECT_OBSERVATION", "Encerrar observação de projeto", "Permite encerrar o ciclo de observação de um projeto.", "Projetos"),
                permission("VIEW_DOMAINS", "Visualizar domínios", "Permite visualizar domínios do observatório.", "Domínios"),
                permission("CREATE_DOMAIN", "Criar domínio", "Permite criar novos domínios.", "Domínios"),
                permission("EDIT_DOMAIN", "Editar domínio", "Permite editar domínios existentes.", "Domínios"),
                permission("VIEW_COMMUNITY", "Visualizar comunidade", "Permite acessar a comunidade observacional autorizada.", "Comunidade"),
                permission("CREATE_DISCUSSION", "Criar discussão", "Permite criar discussões observacionais.", "Comunidade"),
                permission("VIEW_DISCUSSION", "Visualizar discussão", "Permite visualizar discussões observacionais.", "Comunidade"),
                permission("COMMENT_DISCUSSION", "Comentar discussão", "Permite comentar em discussões autorizadas.", "Comunidade"),
                permission("ARCHIVE_DISCUSSION", "Arquivar discussão", "Permite arquivar discussões observacionais.", "Comunidade"),
                permission("CONSOLIDATE_KNOWLEDGE", "Consolidar conhecimento", "Permite consolidar conhecimento a partir de discussões.", "Conhecimento"),
                permission("VIEW_KNOWLEDGE", "Visualizar conhecimento", "Permite visualizar conhecimentos consolidados autorizados.", "Conhecimento"),
                permission("REGISTER_OBSERVATION", "Registrar observação", "Permite registrar observações em projetos.", "Projetos"),
                permission("VIEW_OBSERVATIONS", "Visualizar observações", "Permite visualizar observações registradas em projetos.", "Projetos"),
                permission("UPDATE_PROJECT_STATUS", "Atualizar status do projeto", "Permite atualizar o status de um projeto.", "Projetos"),
                permission("VIEW_GOVERNANCE", "Visualizar governança", "Permite acessar a área de governança do observatório.", "Governança"),
                permission("CONFIGURE_PROFILE_PERMISSIONS", "Configurar permissões de perfil", "Permite configurar a matriz de permissões por perfil.", "Governança")
        );

        return permissionRepository.saveAll(permissions).stream()
                .collect(java.util.stream.Collectors.toMap(Permission::getCode, p -> p));
    }

    private Permission permission(String code, String name, String description, String category) {
        return Permission.builder()
                .code(code)
                .name(name)
                .description(description)
                .category(category)
                .build();
    }

    private void seedProfilePermissions(Map<ProfileCode, Profile> profiles, Map<String, Permission> permissions) {
        Set<String> consultantPermissions = Set.of(
                "VIEW_OBSERVATORY",
                "VIEW_PROJECTS",
                "VIEW_DOMAINS",
                "VIEW_COMMUNITY",
                "CREATE_PROJECT",
                "EDIT_PROJECT",
                "REGISTER_OBSERVATION",
                "VIEW_OBSERVATIONS",
                "CREATE_DISCUSSION",
                "VIEW_DISCUSSION",
                "COMMENT_DISCUSSION",
                "VIEW_KNOWLEDGE"
        );

        Set<String> clientPermissions = Set.of(
                "VIEW_PROJECTS",
                "VIEW_COMMUNITY",
                "VIEW_DISCUSSION",
                "COMMENT_DISCUSSION",
                "VIEW_KNOWLEDGE"
        );

        List<ProfilePermission> matrix = permissions.values().stream()
                .flatMap(permission -> profiles.values().stream()
                        .map(profile -> ProfilePermission.builder()
                                .profile(profile)
                                .permission(permission)
                                .enabled(isEnabled(profile.getCode(), permission.getCode(), consultantPermissions, clientPermissions))
                                .build()))
                .toList();

        profilePermissionRepository.saveAll(matrix);
    }

    private boolean isEnabled(
            ProfileCode profileCode,
            String permissionCode,
            Set<String> consultantPermissions,
            Set<String> clientPermissions
    ) {
        return switch (profileCode) {
            case ADMIN -> true;
            case CONSULTANT -> consultantPermissions.contains(permissionCode);
            case CLIENT -> clientPermissions.contains(permissionCode);
        };
    }
}
