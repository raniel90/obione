package br.com.obione.knowledge.seed;

import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.repository.DiscussionRepository;
import br.com.obione.domains.entity.Domain;
import br.com.obione.knowledge.entity.Knowledge;
import br.com.obione.knowledge.enums.KnowledgeConfidence;
import br.com.obione.knowledge.enums.KnowledgeStatus;
import br.com.obione.knowledge.repository.KnowledgeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(8)
public class KnowledgeDataSeeder implements CommandLineRunner {

    private final KnowledgeRepository knowledgeRepository;
    private final DiscussionRepository discussionRepository;

    public KnowledgeDataSeeder(
            KnowledgeRepository knowledgeRepository,
            DiscussionRepository discussionRepository
    ) {
        this.knowledgeRepository = knowledgeRepository;
        this.discussionRepository = discussionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (knowledgeRepository.count() > 0) {
            return;
        }

        Discussion baixaParticipacao = requireDiscussion("Baixa participação do cliente e atrasos estratégicos");
        Discussion brandingEscopo = requireDiscussion("Por que projetos de Branding apresentam mais mudanças de escopo?");
        Discussion retrabalhoDigital = requireDiscussion("Sinais de retrabalho em campanhas digitais");

        knowledgeRepository.save(
                Knowledge.builder()
                        .domain(baixaParticipacao.getDomain())
                        .project(baixaParticipacao.getProject())
                        .discussion(baixaParticipacao)
                        .phenomenon(baixaParticipacao.getPhenomenon())
                        .title("Baixa participação do cliente aumenta risco de atraso")
                        .summary("Quando o cliente reduz sua participação em validações e decisões, o projeto tende a acumular atrasos e retrabalho.")
                        .evidence("Observações e contribuições na discussão sobre Athos Capital indicam correlação entre baixa resposta e atraso.")
                        .recommendation("Estabelecer ritos de validação com prazos explícitos e responsáveis nomeados pelo cliente.")
                        .confidence(KnowledgeConfidence.HIGH)
                        .status(KnowledgeStatus.CONSOLIDATED)
                        .build()
        );

        knowledgeRepository.save(
                Knowledge.builder()
                        .domain(brandingEscopo.getDomain())
                        .project(brandingEscopo.getProject())
                        .discussion(brandingEscopo)
                        .phenomenon(brandingEscopo.getPhenomenon())
                        .title("Mudanças de escopo em Branding surgem após validações tardias")
                        .summary("Em projetos de branding, mudanças de escopo frequentemente aparecem depois de ciclos de validação já iniciados ou concluídos.")
                        .evidence("Discussão sobre Norvik e fenômeno de retrabalho criativo reforçam o padrão de alterações tardias.")
                        .recommendation("Formalizar critérios de aceite antes da fase criativa e limitar revisões após aprovação.")
                        .confidence(KnowledgeConfidence.MEDIUM)
                        .status(KnowledgeStatus.IN_REVIEW)
                        .build()
        );

        knowledgeRepository.save(
                Knowledge.builder()
                        .domain(retrabalhoDigital.getDomain())
                        .project(retrabalhoDigital.getProject())
                        .discussion(retrabalhoDigital)
                        .phenomenon(retrabalhoDigital.getPhenomenon())
                        .title("Projetos com artefatos bem documentados apresentam maior transparência")
                        .summary("A qualidade e a atualização dos artefatos do projeto facilitam o alinhamento entre equipe, cliente e comunidade observacional.")
                        .evidence("Contribuições sobre campanhas digitais destacam que briefings e atas reduzem ambiguidade nas interpretações.")
                        .recommendation("Incentivar documentação mínima obrigatória por ciclo do projeto e vincular artefatos às observações registradas.")
                        .confidence(KnowledgeConfidence.HIGH)
                        .status(KnowledgeStatus.PROPOSED)
                        .build()
        );

        // Aprendizados de nível-domínio (sem projeto): sabedoria consolidada do domínio,
        // reaproveitável por qualquer projeto — aflora no bloco "Aprendizados do domínio".
        Domain marketing = baixaParticipacao.getDomain();
        knowledgeRepository.save(
                Knowledge.builder()
                        .domain(marketing)
                        .title("Alinhar narrativa e critérios de sucesso no kickoff reduz retrabalho")
                        .summary("Projetos de reposicionamento que fecham a narrativa central e os critérios de sucesso logo no início evitam grandes revisões nas fases finais.")
                        .evidence("Padrão recorrente em projetos de marketing estratégico da consultoria: revisões tardias concentram-se onde o alinhamento inicial ficou implícito.")
                        .recommendation("Formalizar no kickoff a narrativa central, o público e os critérios de sucesso, validados com o cliente antes da execução.")
                        .confidence(KnowledgeConfidence.HIGH)
                        .status(KnowledgeStatus.CONSOLIDATED)
                        .build()
        );
        knowledgeRepository.save(
                Knowledge.builder()
                        .domain(marketing)
                        .title("Checkpoints em datas fixas melhoram a resposta do cliente")
                        .summary("Definir checkpoints recorrentes, com pauta objetiva e responsáveis nomeados, aumenta a taxa e a qualidade das respostas do cliente em decisões estratégicas.")
                        .evidence("Casos do domínio mostram que decisões sem ritual definido acumulam pendências e adiam marcos.")
                        .recommendation("Agendar checkpoints recorrentes com pauta e responsáveis, evitando validações ad hoc.")
                        .confidence(KnowledgeConfidence.MEDIUM)
                        .status(KnowledgeStatus.CONSOLIDATED)
                        .build()
        );
    }

    private Discussion requireDiscussion(String title) {
        return discussionRepository.findByTitle(title)
                .orElseThrow(() -> new IllegalStateException("Discussão não encontrada para seed: " + title));
    }
}
