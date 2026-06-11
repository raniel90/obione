package br.com.obione.mpo.seed;

import br.com.obione.mpo.entity.MpoAttribute;
import br.com.obione.mpo.entity.MpoCategory;
import br.com.obione.mpo.enums.AttributePhase;
import br.com.obione.mpo.repository.MpoAttributeRepository;
import br.com.obione.mpo.repository.MpoCategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Popula o catálogo MPO conforme o Quadro 37 da tese de Vieira (2022):
 * "Observatórios de Projetos: Um Modelo Conceitual" — CIn/UFPE.
 * Fonte: Porto (2021) e Santana (2021), adaptado por Vieira.
 */
@Component
@Order(0)
public class MpoCatalogSeeder implements CommandLineRunner {

    private final MpoCategoryRepository categoryRepo;
    private final MpoAttributeRepository attributeRepo;

    public MpoCatalogSeeder(MpoCategoryRepository categoryRepo, MpoAttributeRepository attributeRepo) {
        this.categoryRepo = categoryRepo;
        this.attributeRepo = attributeRepo;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepo.count() > 0) {
            return;
        }

        MpoCategory geral   = save(cat("GERAL",  "Conteúdo de caráter geral",                    1));
        MpoCategory stak    = save(cat("STAK",   "Conteúdo relacionado a stakeholders",           2));
        MpoCategory esco    = save(cat("ESCO",   "Conteúdo relacionado a escopo",                 3));
        MpoCategory cron    = save(cat("CRON",   "Conteúdo relacionado a cronograma",             4));
        MpoCategory cust    = save(cat("CUST",   "Conteúdo relacionado a custos",                 5));
        MpoCategory risc    = save(cat("RISC",   "Conteúdo relacionado a riscos",                 6));
        MpoCategory muda    = save(cat("MUDA",   "Conteúdo relacionado a mudanças",               7));
        MpoCategory lic     = save(cat("LIC",    "Conteúdo relacionado a lições aprendidas",      8));

        List<MpoAttribute> attributes = List.of(
            // ── GERAL (INITIAL)
            attr("GERAL-01", "Nome do projeto",
                 "Denominação oficial do projeto observado.", AttributePhase.INITIAL, geral),
            attr("GERAL-02", "Descrição",
                 "Descrição geral do propósito e contexto do projeto.", AttributePhase.INITIAL, geral),
            attr("GERAL-03", "Local de execução",
                 "Localização geográfica ou organizacional onde o projeto é executado.", AttributePhase.INITIAL, geral),
            attr("GERAL-04", "Tipo",
                 "Classificação do projeto (ex: estratégico, gerencial, híbrido).", AttributePhase.INITIAL, geral),
            attr("GERAL-05", "Porte",
                 "Dimensão do projeto em termos de complexidade, equipe ou investimento.", AttributePhase.INITIAL, geral),
            attr("GERAL-06", "Objetivos",
                 "Resultados esperados e metas do projeto.", AttributePhase.INITIAL, geral),
            attr("GERAL-07", "Descrição dos produtos e serviços gerados",
                 "Entregáveis e resultados tangíveis do projeto.", AttributePhase.INITIAL, geral),
            attr("GERAL-08", "Licitação",
                 "Informações sobre processo licitatório (para projetos públicos).", AttributePhase.INITIAL, geral),
            attr("GERAL-09", "Contratos",
                 "Documentos contratuais que regem o projeto.", AttributePhase.INITIAL, geral),
            attr("GERAL-10", "Termo de encerramento",
                 "Documento formal que registra a conclusão do projeto.", AttributePhase.CLOSURE, geral),
            attr("GERAL-11", "Justificativas do projeto",
                 "Motivações e razões que originaram o projeto.", AttributePhase.INITIAL, geral),
            attr("GERAL-12", "Impactos do projeto a curto e longo prazo",
                 "Efeitos esperados e observados no curto e longo prazo.", AttributePhase.TRACKING, geral),
            attr("GERAL-13", "Indicadores do projeto",
                 "Métricas e KPIs utilizados para acompanhar o projeto.", AttributePhase.TRACKING, geral),
            attr("GERAL-14", "Artefatos produzidos no projeto",
                 "Documentos, entregáveis e produtos gerados ao longo do projeto.", AttributePhase.TRACKING, geral),
            attr("GERAL-15", "Imagens e fotos do projeto",
                 "Registros visuais do projeto e seus entregáveis.", AttributePhase.TRACKING, geral),

            // ── STAKEHOLDERS (INITIAL)
            attr("STAK-01", "Nome dos stakeholders",
                 "Identificação das partes interessadas no projeto.", AttributePhase.INITIAL, stak),
            attr("STAK-02", "Função no projeto",
                 "Papel exercido por cada stakeholder (ex: cliente, patrocinador, gestor).", AttributePhase.INITIAL, stak),
            attr("STAK-03", "Público-alvo do projeto",
                 "Beneficiários diretos ou indiretos do projeto.", AttributePhase.INITIAL, stak),
            attr("STAK-04", "Detalhes da equipe do projeto",
                 "Composição, papéis e responsabilidades da equipe executora.", AttributePhase.INITIAL, stak),
            attr("STAK-05", "Treinamentos realizados pelas equipes",
                 "Capacitações conduzidas durante o ciclo do projeto.", AttributePhase.TRACKING, stak),

            // ── ESCOPO
            attr("ESCO-01", "Tarefas do projeto",
                 "Atividades e entregas que compõem o escopo do projeto.", AttributePhase.TRACKING, esco),
            attr("ESCO-02", "Requisitos",
                 "Necessidades e restrições que o projeto deve atender.", AttributePhase.INITIAL, esco),
            attr("ESCO-03", "Escopo planejado",
                 "Definição formal do escopo acordada no início do projeto.", AttributePhase.INITIAL, esco),
            attr("ESCO-04", "Escopo executado",
                 "Escopo efetivamente realizado ao longo ou ao final do projeto.", AttributePhase.TRACKING, esco),

            // ── CRONOGRAMA
            attr("CRON-01", "Data de início do projeto",
                 "Data oficial de início das atividades do projeto.", AttributePhase.INITIAL, cron),
            attr("CRON-02", "Data de fim planejada",
                 "Data prevista para a conclusão do projeto.", AttributePhase.INITIAL, cron),
            attr("CRON-03", "Data de fim executada",
                 "Data real de conclusão do projeto.", AttributePhase.CLOSURE, cron),
            attr("CRON-04", "Entregas a serem realizadas",
                 "Marcos e entregáveis previstos no cronograma.", AttributePhase.INITIAL, cron),
            attr("CRON-05", "Status do cronograma",
                 "Situação atual do cronograma em relação ao planejado.", AttributePhase.TRACKING, cron),

            // ── CUSTOS
            attr("CUST-01", "Custo estimado",
                 "Orçamento planejado para a execução do projeto.", AttributePhase.INITIAL, cust),
            attr("CUST-02", "Custo realizado",
                 "Valor efetivamente gasto ao longo ou ao final do projeto.", AttributePhase.CLOSURE, cust),
            attr("CUST-03", "Justificativas dos gastos",
                 "Explicações para desvios ou alocações de custos.", AttributePhase.TRACKING, cust),

            // ── RISCOS
            attr("RISC-01", "Riscos identificados",
                 "Relação de riscos mapeados no início ou durante o projeto.", AttributePhase.INITIAL, risc),
            attr("RISC-02", "Análise qualitativa de riscos",
                 "Avaliação da probabilidade e impacto dos riscos por categoria.", AttributePhase.TRACKING, risc),
            attr("RISC-03", "Análise quantitativa de riscos",
                 "Mensuração numérica dos riscos identificados.", AttributePhase.TRACKING, risc),
            attr("RISC-04", "Planejamento de respostas aos riscos",
                 "Estratégias definidas para mitigar ou aceitar os riscos.", AttributePhase.TRACKING, risc),
            attr("RISC-05", "Monitoramento dos riscos",
                 "Acompanhamento contínuo dos riscos ao longo do projeto.", AttributePhase.TRACKING, risc),

            // ── MUDANÇAS (TRACKING)
            attr("MUDA-01", "Custo de implementação da mudança",
                 "Impacto financeiro decorrente de alterações solicitadas.", AttributePhase.TRACKING, muda),
            attr("MUDA-02", "Análise de custo-benefício da mudança",
                 "Avaliação do valor gerado em relação ao custo da mudança.", AttributePhase.TRACKING, muda),
            attr("MUDA-03", "Impactos da mudança no escopo",
                 "Alterações no escopo causadas por solicitações de mudança.", AttributePhase.TRACKING, muda),
            attr("MUDA-04", "Impactos da mudança no cronograma",
                 "Efeitos sobre o cronograma decorrentes de mudanças aprovadas.", AttributePhase.TRACKING, muda),

            // ── LIÇÕES APRENDIDAS (CLOSURE)
            attr("LIC-01", "Pontos fortes",
                 "Aspectos positivos identificados ao longo do projeto.", AttributePhase.CLOSURE, lic),
            attr("LIC-02", "Pontos fracos",
                 "Dificuldades e deficiências observadas no projeto.", AttributePhase.CLOSURE, lic),
            attr("LIC-03", "Dificuldades encontradas",
                 "Obstáculos e desafios enfrentados durante a execução.", AttributePhase.CLOSURE, lic),
            attr("LIC-04", "Providências tomadas",
                 "Ações corretivas e preventivas adotadas diante das dificuldades.", AttributePhase.CLOSURE, lic)
        );

        attributeRepo.saveAll(attributes);
    }

    private MpoCategory save(MpoCategory category) {
        return categoryRepo.save(category);
    }

    private MpoCategory cat(String code, String name, int order) {
        return MpoCategory.builder().code(code).name(name).orderIndex(order).build();
    }

    private MpoAttribute attr(String code, String name, String description,
                               AttributePhase phase, MpoCategory category) {
        return MpoAttribute.builder()
                .code(code)
                .name(name)
                .description(description)
                .phase(phase)
                .category(category)
                .build();
    }
}
