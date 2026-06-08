package br.com.obione.observations.seed;

import br.com.obione.observations.entity.Observation;
import br.com.obione.observations.enums.ObservationImpact;
import br.com.obione.observations.enums.ObservationStatus;
import br.com.obione.observations.repository.ObservationRepository;
import br.com.obione.observations.service.ProjectObservationEffects;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.enums.RiskLevel;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.users.entity.User;
import br.com.obione.users.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Order(5)
public class ObservationDataSeeder implements CommandLineRunner {

    private final ObservationRepository observationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ObservationDataSeeder(
            ObservationRepository observationRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository
    ) {
        this.observationRepository = observationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (observationRepository.count() > 0) {
            return;
        }

        User consultant = userRepository.findByEmailIgnoreCase("consultor@obione.dev")
                .orElseThrow(() -> new IllegalStateException("Consultor não encontrado para seed de observações"));

        Project athos = requireProject("Reposicionamento Athos Capital");
        Project norvik = requireProject("Identidade Visual Norvik");
        Project latam = requireProject("Panorama Setor SaaS LATAM");

        List<SeedObservation> seeds = List.of(
                new SeedObservation(
                        athos,
                        "Baixa participação do cliente nas validações iniciais",
                        "O cliente demorou vários dias para retornar sobre decisões estratégicas.",
                        "Engajamento",
                        ObservationImpact.MEDIUM,
                        RiskLevel.MODERATE,
                        "A baixa participação pode gerar atraso e retrabalho."
                ),
                new SeedObservation(
                        athos,
                        "Mudança de escopo após validação inicial",
                        "Houve solicitação de alteração no posicionamento após aprovação da proposta inicial.",
                        "Escopo",
                        ObservationImpact.HIGH,
                        RiskLevel.HIGH,
                        "Mudanças tardias aumentam risco de retrabalho."
                ),
                new SeedObservation(
                        norvik,
                        "Retrabalho criativo após aprovação visual",
                        "Peças visuais aprovadas foram reabertas após nova avaliação do cliente.",
                        "Retrabalho",
                        ObservationImpact.HIGH,
                        RiskLevel.MODERATE,
                        "Validações tardias indicam necessidade de critérios de aceite mais claros."
                ),
                new SeedObservation(
                        latam,
                        "Baixa taxa de resposta dos participantes",
                        "A coleta de dados teve adesão menor que a planejada.",
                        "Pesquisa",
                        ObservationImpact.MEDIUM,
                        RiskLevel.MODERATE,
                        "Baixa resposta pode afetar a representatividade dos resultados."
                )
        );

        Map<Project, Boolean> touchedProjects = new HashMap<>();

        for (SeedObservation seed : seeds) {
            Observation observation = Observation.builder()
                    .project(seed.project())
                    .title(seed.title())
                    .description(seed.description())
                    .attributeId(seed.attributeId())
                    .impact(seed.impact())
                    .risk(seed.risk())
                    .interpretation(seed.interpretation())
                    .status(ObservationStatus.REGISTERED)
                    .createdBy(consultant)
                    .build();

            observationRepository.save(observation);
            ProjectObservationEffects.apply(seed.project(), seed.risk());
            touchedProjects.put(seed.project(), true);
        }

        touchedProjects.keySet().forEach(projectRepository::save);
    }

    private Project requireProject(String name) {
        return projectRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Projeto não encontrado para seed: " + name));
    }

    private record SeedObservation(
            Project project,
            String title,
            String description,
            String attributeId,
            ObservationImpact impact,
            RiskLevel risk,
            String interpretation
    ) {
    }
}
