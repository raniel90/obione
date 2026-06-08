package br.com.obione.domains.seed;

import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.enums.DomainStatus;
import br.com.obione.domains.enums.DomainType;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.domains.util.SlugUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(3)
public class DomainDataSeeder implements CommandLineRunner {

    private final DomainRepository domainRepository;

    public DomainDataSeeder(DomainRepository domainRepository) {
        this.domainRepository = domainRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (domainRepository.count() > 0) {
            return;
        }

        domainRepository.saveAll(List.of(
                build(
                        "Marketing Estratégico",
                        "Posicionamento, planejamento e estratégia de marca.",
                        DomainType.STRATEGIC,
                        DomainStatus.ACTIVE,
                        "Observar como o posicionamento estratégico se sustenta ao longo do ciclo dos projetos.",
                        List.of("Risco", "Mudanças de escopo", "Aprendizado"),
                        List.of(
                                "Instabilidade de posicionamento em projetos com baixa validação inicial",
                                "Diagnósticos estratégicos antecipam decisões de governança"
                        ),
                        4, 7, 5, 3, 2, 64.0
                ),
                build(
                        "Branding",
                        "Identidade, narrativa e expressão de marca.",
                        DomainType.HYBRID,
                        DomainStatus.ACTIVE,
                        "Acompanhar a expressão simbólica e a coerência criativa das marcas observadas.",
                        List.of("Mudanças de escopo", "Engajamento", "Colaboração"),
                        List.of(
                                "Mudanças recorrentes de escopo criativo",
                                "Alta colaboração em revisões de identidade visual"
                        ),
                        3, 8, 6, 4, 3, 78.0
                ),
                build(
                        "Pesquisa de Mercado",
                        "Investigação de público, comportamento e tendências.",
                        DomainType.STRATEGIC,
                        DomainStatus.MONITORED,
                        "Investigar comportamentos de público e padrões de mercado a partir de evidências coletadas.",
                        List.of("Aprendizado", "Transparência", "Engajamento"),
                        List.of("Atrasos associados à baixa taxa de resposta dos participantes"),
                        2, 5, 3, 2, 1, 52.0
                ),
                build(
                        "Comunicação Digital",
                        "Conteúdo, presença digital e canais.",
                        DomainType.MANAGERIAL,
                        DomainStatus.ACTIVE,
                        "Observar a coerência editorial e a continuidade das narrativas em canais digitais.",
                        List.of("Engajamento", "Colaboração", "Transparência"),
                        List.of(
                                "Alta volatilidade de requisitos em campanhas multicanal",
                                "Cadência editorial estável em projetos consolidados"
                        ),
                        3, 6, 4, 3, 2, 71.0
                ),
                build(
                        "Gestão Comercial",
                        "Funil, performance e expansão de receita.",
                        DomainType.MANAGERIAL,
                        DomainStatus.IN_REVIEW,
                        "Observar a relação entre operação comercial e direcionamento estratégico.",
                        List.of("Risco", "Transparência", "Aprendizado"),
                        List.of("Maior dependência de alinhamento entre operação e estratégia"),
                        2, 4, 2, 1, 1, 58.0
                ),
                build(
                        "Projetos Acadêmicos",
                        "Iniciativas de pesquisa aplicada e ensino.",
                        DomainType.ACADEMIC,
                        DomainStatus.FORMING,
                        "Acompanhar a maturação de iniciativas de pesquisa aplicada e ensino.",
                        List.of("Aprendizado", "Transparência", "Colaboração"),
                        List.of(),
                        1, 3, 1, 1, 0, 41.0
                )
        ));
    }

    private Domain build(
            String name,
            String description,
            DomainType type,
            DomainStatus status,
            String observationObjective,
            List<String> priorityIndicators,
            List<String> expectedPhenomena,
            int projectCount,
            int participantCount,
            int discussionCount,
            int knowledgeCount,
            int phenomenonCount,
            double engagementRate
    ) {
        return Domain.builder()
                .slug(SlugUtils.generate(name))
                .name(name)
                .description(description)
                .type(type)
                .status(status)
                .observationObjective(observationObjective)
                .priorityIndicators(priorityIndicators)
                .expectedPhenomena(expectedPhenomena)
                .projectCount(projectCount)
                .participantCount(participantCount)
                .discussionCount(discussionCount)
                .knowledgeCount(knowledgeCount)
                .phenomenonCount(phenomenonCount)
                .engagementRate(engagementRate)
                .build();
    }
}
