package br.com.obione.discussions.seed;

import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.entity.DiscussionContribution;
import br.com.obione.discussions.enums.ContributionType;
import br.com.obione.discussions.enums.DiscussionStatus;
import br.com.obione.discussions.enums.DiscussionVisibility;
import br.com.obione.discussions.repository.DiscussionContributionRepository;
import br.com.obione.discussions.repository.DiscussionRepository;
import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.phenomena.repository.PhenomenonRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.users.entity.User;
import br.com.obione.users.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(7)
public class DiscussionDataSeeder implements CommandLineRunner {

    private final DiscussionRepository discussionRepository;
    private final DiscussionContributionRepository contributionRepository;
    private final DomainRepository domainRepository;
    private final ProjectRepository projectRepository;
    private final PhenomenonRepository phenomenonRepository;
    private final UserRepository userRepository;

    public DiscussionDataSeeder(
            DiscussionRepository discussionRepository,
            DiscussionContributionRepository contributionRepository,
            DomainRepository domainRepository,
            ProjectRepository projectRepository,
            PhenomenonRepository phenomenonRepository,
            UserRepository userRepository
    ) {
        this.discussionRepository = discussionRepository;
        this.contributionRepository = contributionRepository;
        this.domainRepository = domainRepository;
        this.projectRepository = projectRepository;
        this.phenomenonRepository = phenomenonRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (discussionRepository.count() > 0) {
            return;
        }

        User consultant = requireUser("consultor@obione.dev");
        User admin = requireUser("admin@obione.dev");

        Domain branding = requireDomain("Branding");
        Domain marketing = requireDomain("Marketing Estratégico");
        Domain comunicacao = requireDomain("Comunicação Digital");
        Domain pesquisa = requireDomain("Pesquisa de Mercado");

        Project norvik = requireProject("Identidade Visual Norvik");
        Project athos = requireProject("Reposicionamento Athos Capital");
        Project orion = requireProject("Campanha Lançamento Orion");
        Project latam = requireProject("Panorama Setor SaaS LATAM");

        Phenomenon baixaParticipacao = requirePhenomenon(marketing.getId(), "Baixa participação do cliente");
        Phenomenon baixaResposta = requirePhenomenon(pesquisa.getId(), "Baixa taxa de resposta dos participantes");
        Phenomenon retrabalhoCriativo = requirePhenomenon(branding.getId(), "Retrabalho criativo");

        Discussion d1 = saveDiscussion(
                branding,
                norvik,
                retrabalhoCriativo,
                null,
                "Por que projetos de Branding apresentam mais mudanças de escopo?",
                "Por que projetos de Branding apresentam mais mudanças de escopo?",
                DiscussionStatus.IN_ANALYSIS,
                DiscussionVisibility.DOMAIN,
                consultant
        );

        Discussion d2 = saveDiscussion(
                marketing,
                athos,
                baixaParticipacao,
                null,
                "Baixa participação do cliente e atrasos estratégicos",
                "A baixa participação do cliente impactou o atraso em projetos estratégicos?",
                DiscussionStatus.OPEN,
                DiscussionVisibility.PROJECT,
                consultant
        );

        Discussion d3 = saveDiscussion(
                comunicacao,
                orion,
                null,
                null,
                "Sinais de retrabalho em campanhas digitais",
                "Quais sinais indicam risco de retrabalho em campanhas digitais?",
                DiscussionStatus.REVIEWED,
                DiscussionVisibility.CONSULTANTS,
                admin
        );

        Discussion d4 = saveDiscussion(
                pesquisa,
                latam,
                baixaResposta,
                null,
                "Atrasos em pesquisa e taxa de resposta",
                "Atrasos em Pesquisa de Mercado estão relacionados à baixa taxa de resposta?",
                DiscussionStatus.CONSOLIDATED,
                DiscussionVisibility.DOMAIN,
                consultant
        );

        seedContributions(d1, consultant, admin,
                new ContributionSeed(ContributionType.HYPOTHESIS, consultant,
                        "Projetos de branding costumam ter ciclos de validação mais longos, o que aumenta a chance de mudanças tardias de escopo."),
                new ContributionSeed(ContributionType.EVIDENCE, admin,
                        "Nos últimos três projetos de branding, houve pelo menos duas revisões de escopo após aprovação inicial."),
                new ContributionSeed(ContributionType.INTERPRETATION, consultant,
                        "A ausência de critérios de aceite explícitos parece amplificar mudanças de escopo no domínio.")
        );

        seedContributions(d2, consultant, admin,
                new ContributionSeed(ContributionType.EVIDENCE, consultant,
                        "No projeto Athos Capital, atrasos coincidiram com períodos de baixa resposta do cliente em validações."),
                new ContributionSeed(ContributionType.HYPOTHESIS, admin,
                        "Baixa participação do cliente pode ser um indicador antecedente de atraso em projetos estratégicos."),
                new ContributionSeed(ContributionType.COUNTERPOINT, consultant,
                        "Nem todo atraso pode ser atribuído ao cliente; fatores internos de planejamento também influenciam.")
        );

        seedContributions(d3, consultant, admin,
                new ContributionSeed(ContributionType.EVIDENCE, consultant,
                        "Campanhas com múltiplos canais e revisões frequentes de briefing apresentam maior incidência de retrabalho."),
                new ContributionSeed(ContributionType.FEEDBACK, admin,
                        "Sugiro monitorar volatilidade de requisitos e cadência de aprovações como sinais precoces.")
        );

        seedContributions(d4, consultant, admin,
                new ContributionSeed(ContributionType.EVIDENCE, consultant,
                        "A coleta do projeto LATAM ficou abaixo da meta planejada nas duas primeiras semanas."),
                new ContributionSeed(ContributionType.VALIDATION, admin,
                        "A correlação entre baixa resposta e atraso precisa ser confirmada com mais casos no domínio."),
                new ContributionSeed(ContributionType.INTERPRETATION, consultant,
                        "Baixa taxa de resposta reduz a representatividade e alonga a consolidação dos resultados.")
        );
    }

    private void seedContributions(
            Discussion discussion,
            User consultant,
            User admin,
            ContributionSeed... seeds
    ) {
        for (ContributionSeed seed : seeds) {
            contributionRepository.save(DiscussionContribution.builder()
                    .discussion(discussion)
                    .user(seed.user())
                    .type(seed.type())
                    .text(seed.text())
                    .build());
        }
    }

    private Discussion saveDiscussion(
            Domain domain,
            Project project,
            Phenomenon phenomenon,
            Long observationId,
            String title,
            String question,
            DiscussionStatus status,
            DiscussionVisibility visibility,
            User createdBy
    ) {
        return discussionRepository.save(Discussion.builder()
                .domain(domain)
                .project(project)
                .phenomenon(phenomenon)
                .observationId(observationId)
                .title(title)
                .question(question)
                .status(status)
                .visibility(visibility)
                .createdBy(createdBy)
                .build());
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado para seed: " + email));
    }

    private Domain requireDomain(String name) {
        return domainRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Domínio não encontrado para seed: " + name));
    }

    private Project requireProject(String name) {
        return projectRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Projeto não encontrado para seed: " + name));
    }

    private Phenomenon requirePhenomenon(Long domainId, String name) {
        return phenomenonRepository.findByDomain_IdAndName(domainId, name)
                .orElseThrow(() -> new IllegalStateException("Fenômeno não encontrado para seed: " + name));
    }

    private record ContributionSeed(ContributionType type, User user, String text) {
    }
}
