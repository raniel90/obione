package br.com.obione.observations.seed;

import br.com.obione.mpo.entity.MpoAttribute;
import br.com.obione.mpo.repository.MpoAttributeRepository;
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
    private final MpoAttributeRepository mpoAttributeRepository;

    public ObservationDataSeeder(
            ObservationRepository observationRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            MpoAttributeRepository mpoAttributeRepository
    ) {
        this.observationRepository = observationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.mpoAttributeRepository = mpoAttributeRepository;
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

        MpoAttribute stak01 = requireAttr("STAK-01");
        MpoAttribute muda03 = requireAttr("MUDA-03");
        MpoAttribute esco01 = requireAttr("ESCO-01");
        MpoAttribute risc02 = requireAttr("RISC-02");

        List<SeedObservation> seeds = List.of(
                new SeedObservation(
                        athos,
                        "Baixa participação do cliente nas validações iniciais",
                        "O cliente demorou vários dias para retornar sobre decisões estratégicas.",
                        stak01,
                        ObservationImpact.MEDIUM,
                        RiskLevel.MODERATE,
                        "A baixa participação pode gerar atraso e retrabalho."
                ),
                new SeedObservation(
                        athos,
                        "Mudança de escopo após validação inicial",
                        "Houve solicitação de alteração no posicionamento após aprovação da proposta inicial.",
                        muda03,
                        ObservationImpact.HIGH,
                        RiskLevel.HIGH,
                        "Mudanças tardias aumentam risco de retrabalho."
                ),
                new SeedObservation(
                        norvik,
                        "Retrabalho criativo após aprovação visual",
                        "Peças visuais aprovadas foram reabertas após nova avaliação do cliente.",
                        esco01,
                        ObservationImpact.HIGH,
                        RiskLevel.MODERATE,
                        "Validações tardias indicam necessidade de critérios de aceite mais claros."
                ),
                new SeedObservation(
                        latam,
                        "Baixa taxa de resposta dos participantes",
                        "A coleta de dados teve adesão menor que a planejada.",
                        risc02,
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
                    .mpoAttribute(seed.mpoAttribute())
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

    private MpoAttribute requireAttr(String code) {
        return mpoAttributeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalStateException("Atributo MPO não encontrado para seed: " + code));
    }

    private record SeedObservation(
            Project project,
            String title,
            String description,
            MpoAttribute mpoAttribute,
            ObservationImpact impact,
            RiskLevel risk,
            String interpretation
    ) {
    }
}
