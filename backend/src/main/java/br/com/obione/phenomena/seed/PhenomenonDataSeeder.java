package br.com.obione.phenomena.seed;

import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.phenomena.enums.PhenomenonImpact;
import br.com.obione.phenomena.enums.PhenomenonStatus;
import br.com.obione.phenomena.enums.PhenomenonTrend;
import br.com.obione.phenomena.mapper.PhenomenonMapper;
import br.com.obione.phenomena.repository.PhenomenonRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.repository.ProjectRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(6)
public class PhenomenonDataSeeder implements CommandLineRunner {

    private final PhenomenonRepository phenomenonRepository;
    private final DomainRepository domainRepository;
    private final ProjectRepository projectRepository;

    public PhenomenonDataSeeder(
            PhenomenonRepository phenomenonRepository,
            DomainRepository domainRepository,
            ProjectRepository projectRepository
    ) {
        this.phenomenonRepository = phenomenonRepository;
        this.domainRepository = domainRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (phenomenonRepository.count() > 0) {
            return;
        }

        Domain marketing = requireDomain("Marketing Estratégico");
        Domain branding = requireDomain("Branding");
        Domain pesquisa = requireDomain("Pesquisa de Mercado");

        Project athos = requireProject("Reposicionamento Athos Capital");
        Project norvik = requireProject("Identidade Visual Norvik");
        Project latam = requireProject("Panorama Setor SaaS LATAM");

        phenomenonRepository.saveAll(List.of(
                build(
                        marketing,
                        athos,
                        "Mudanças recorrentes de escopo",
                        "Padrão observado quando alterações de escopo ocorrem após validações iniciais já aprovadas.",
                        3,
                        List.of("Escopo", "Mudanças de escopo"),
                        PhenomenonImpact.HIGH,
                        PhenomenonTrend.GROWING,
                        PhenomenonStatus.IN_ANALYSIS
                ),
                build(
                        marketing,
                        athos,
                        "Baixa participação do cliente",
                        "Sinal recorrente de baixo engajamento do cliente em ritos de validação e decisão.",
                        2,
                        List.of("Engajamento"),
                        PhenomenonImpact.MEDIUM,
                        PhenomenonTrend.GROWING,
                        PhenomenonStatus.OBSERVED
                ),
                build(
                        branding,
                        norvik,
                        "Atraso em validações",
                        "Validações visuais e estratégicas demoram além do ciclo planejado.",
                        4,
                        List.of("Prazo", "Aprovações"),
                        PhenomenonImpact.MEDIUM,
                        PhenomenonTrend.STABLE,
                        PhenomenonStatus.OBSERVED
                ),
                build(
                        branding,
                        norvik,
                        "Retrabalho criativo",
                        "Peças criativas aprovadas retornam para revisão após nova avaliação do cliente.",
                        5,
                        List.of("Retrabalho"),
                        PhenomenonImpact.HIGH,
                        PhenomenonTrend.GROWING,
                        PhenomenonStatus.IN_ANALYSIS
                ),
                build(
                        pesquisa,
                        latam,
                        "Baixa taxa de resposta dos participantes",
                        "Coletas de pesquisa com adesão abaixo do planejado afetam a representatividade dos dados.",
                        3,
                        List.of("Pesquisa"),
                        PhenomenonImpact.MEDIUM,
                        PhenomenonTrend.STABLE,
                        PhenomenonStatus.OBSERVED
                )
        ));
    }

    private Phenomenon build(
            Domain domain,
            Project project,
            String name,
            String description,
            int evidenceCount,
            List<String> relatedAttributeIds,
            PhenomenonImpact impact,
            PhenomenonTrend trend,
            PhenomenonStatus status
    ) {
        return Phenomenon.builder()
                .domain(domain)
                .project(project)
                .name(name)
                .description(description)
                .evidenceCount(evidenceCount)
                .relatedAttributeIds(PhenomenonMapper.joinRelatedAttributeIds(relatedAttributeIds))
                .impact(impact)
                .trend(trend)
                .status(status)
                .build();
    }

    private Domain requireDomain(String name) {
        return domainRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Domínio não encontrado para seed: " + name));
    }

    private Project requireProject(String name) {
        return projectRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Projeto não encontrado para seed: " + name));
    }
}
