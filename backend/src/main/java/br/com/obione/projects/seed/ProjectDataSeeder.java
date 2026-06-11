package br.com.obione.projects.seed;

import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.profiles.entity.Profile;
import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.profiles.repository.ProfileRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.enums.ClientEngagement;
import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.ProjectType;
import br.com.obione.projects.enums.RiskLevel;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.users.entity.User;
import br.com.obione.users.enums.UserStatus;
import br.com.obione.users.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(4)
public class ProjectDataSeeder implements CommandLineRunner {

    private final ProjectRepository projectRepository;
    private final DomainRepository domainRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public ProjectDataSeeder(
            ProjectRepository projectRepository,
            DomainRepository domainRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.projectRepository = projectRepository;
        this.domainRepository = domainRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (projectRepository.count() > 0) {
            return;
        }

        User clientAthos = requireUserByEmail("cliente@obione.dev");
        User clientNorvik = ensureClient("Cliente Norvik", "norvik@cliente.dev");
        User clientLatam = ensureClient("Cliente LATAM", "latam@cliente.dev");
        User consultantLucas = requireUserByEmail("consultor@obione.dev");

        Domain marketing = requireDomainBySlug("marketing-estrategico");
        Domain branding = requireDomainBySlug("branding");
        Domain pesquisa = requireDomainBySlug("pesquisa-de-mercado");
        Domain comunicacao = requireDomainBySlug("comunicacao-digital");

        projectRepository.saveAll(List.of(
                buildProject(
                        "Reposicionamento Athos Capital",
                        marketing,
                        clientAthos,
                        consultantLucas,
                        ProjectType.STRATEGIC,
                        ProjectStatus.ACTIVE,
                        "Reconstrução do posicionamento institucional e narrativa de mercado para audiência B2B premium.",
                        "Observar a estabilidade do posicionamento e validações com o cliente ao longo do ciclo.",
                        List.of("GERAL-01", "GERAL-06", "STAK-01", "STAK-04", "RISC-01"),
                        List.of("B2B", "Posicionamento", "Premium"),
                        68,
                        RiskLevel.LOW,
                        ClientEngagement.HIGH,
                        LocalDate.of(2026, 2, 22),
                        LocalDate.of(2026, 8, 22)
                ),
                buildProject(
                        "Identidade Visual Norvik",
                        branding,
                        clientNorvik,
                        consultantLucas,
                        ProjectType.HYBRID,
                        ProjectStatus.REVIEW,
                        "Sistema de identidade visual completo e diretrizes de aplicação para nova marca tech.",
                        "Acompanhar coerência criativa e ciclos de aprovação da identidade visual.",
                        List.of("GERAL-01", "GERAL-07", "STAK-03"),
                        List.of("Visual", "Sistema", "Tech"),
                        84,
                        RiskLevel.LOW,
                        ClientEngagement.HIGH,
                        LocalDate.of(2026, 2, 19),
                        LocalDate.of(2026, 8, 19)
                ),
                buildProject(
                        "Panorama Setor SaaS LATAM",
                        pesquisa,
                        clientLatam,
                        consultantLucas,
                        ProjectType.STRATEGIC,
                        ProjectStatus.ACTIVE,
                        "Mapeamento competitivo e análise de comportamento de compra em SaaS na América Latina.",
                        "Investigar padrões de mercado e taxa de resposta em estudos qualitativos.",
                        List.of("GERAL-01", "GERAL-13", "RISC-01", "RISC-02"),
                        List.of("SaaS", "LATAM", "Competitivo"),
                        42,
                        RiskLevel.MODERATE,
                        ClientEngagement.MEDIUM,
                        LocalDate.of(2026, 2, 24),
                        LocalDate.of(2026, 8, 24)
                ),
                buildProject(
                        "Campanha Lançamento Orion",
                        comunicacao,
                        null,
                        consultantLucas,
                        ProjectType.MANAGERIAL,
                        ProjectStatus.PLANNED,
                        "Planejamento omnichannel para lançamento de produto enterprise no segundo semestre.",
                        "Observar volatilidade de requisitos e cadência editorial da campanha.",
                        List.of("GERAL-01", "CRON-01", "CRON-02", "CUST-01"),
                        List.of("Lançamento", "Omnichannel"),
                        18,
                        RiskLevel.MODERATE,
                        ClientEngagement.LOW,
                        LocalDate.of(2026, 2, 20),
                        LocalDate.of(2026, 9, 20)
                )
        ));
    }

    private User ensureClient(String name, String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> {
                    Profile clientProfile = profileRepository.findByCode(ProfileCode.CLIENT)
                            .orElseThrow(() -> new IllegalStateException("Perfil CLIENT não encontrado"));

                    User user = User.builder()
                            .name(name)
                            .email(email)
                            .password(passwordEncoder.encode("cliente123"))
                            .profile(clientProfile)
                            .status(UserStatus.ACTIVE)
                            .domainIds(new ArrayList<>())
                            .projectIds(new ArrayList<>())
                            .build();

                    return userRepository.save(user);
                });
    }

    private User requireUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado para seed: " + email));
    }

    private Domain requireDomainBySlug(String slug) {
        return domainRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalStateException("Domínio não encontrado para seed: " + slug));
    }

    private Project buildProject(
            String name,
            Domain domain,
            User client,
            User consultant,
            ProjectType type,
            ProjectStatus status,
            String summary,
            String observationObjective,
            List<String> initialAttributeIds,
            List<String> expectedPhenomena,
            int progress,
            RiskLevel riskLevel,
            ClientEngagement clientEngagement,
            LocalDate startDate,
            LocalDate expectedEndDate
    ) {
        return Project.builder()
                .name(name)
                .domain(domain)
                .client(client)
                .consultant(consultant)
                .type(type)
                .status(status)
                .summary(summary)
                .observationObjective(observationObjective)
                .initialAttributeIds(initialAttributeIds)
                .expectedPhenomena(expectedPhenomena)
                .progress(progress)
                .riskLevel(riskLevel)
                .clientEngagement(clientEngagement)
                .startDate(startDate)
                .expectedEndDate(expectedEndDate)
                .build();
    }
}
