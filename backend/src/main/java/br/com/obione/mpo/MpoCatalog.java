package br.com.obione.mpo;

import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.mpo.dto.MpoCategoryDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Canonical MPO observation lens: the 44 attributes / 8 categories of the
 * Quadro 37 (Vieira, 2022). Static reference data — the schema by which projects
 * are observed and coverage is measured. Mirrors {@code atividades/atributos_alvo_mpo.md}.
 */
@Component
public class MpoCatalog {

    private static final String ESTRUTURADO = "estruturado";
    private static final String TEXTO_LIVRE = "texto_livre";
    private static final String FORA_DE_ESCOPO = "fora_de_escopo";

    private final List<MpoCategoryDTO> categories = build();

    /** The 8 categories, each with its attributes, in MPO order. */
    public List<MpoCategoryDTO> categories() {
        return categories;
    }

    /** All 44 attributes, flat. */
    public List<MpoAttributeDTO> attributes() {
        List<MpoAttributeDTO> all = new ArrayList<>();
        for (MpoCategoryDTO c : categories) {
            all.addAll(c.attributes());
        }
        return all;
    }

    /** Attributes that count toward coverage (excludes {@code fora_de_escopo}). */
    public List<MpoAttributeDTO> inScopeAttributes() {
        return attributes().stream().filter(a -> !FORA_DE_ESCOPO.equals(a.type())).toList();
    }

    private static List<MpoCategoryDTO> build() {
        List<MpoCategoryDTO> cats = new ArrayList<>();
        cats.add(cat("conteudo_geral", "Conteúdo geral", 1, new String[][]{
                {"nome_projeto", "Nome do projeto", ESTRUTURADO},
                {"descricao", "Descrição", TEXTO_LIVRE},
                {"local_execucao", "Local de execução", ESTRUTURADO},
                {"tipo", "Tipo", ESTRUTURADO},
                {"porte", "Porte", ESTRUTURADO},
                {"objetivos", "Objetivos", TEXTO_LIVRE},
                {"descricao_produtos_servicos", "Produtos e serviços", TEXTO_LIVRE},
                {"licitacao", "Licitação", ESTRUTURADO},
                {"contratos", "Contratos", ESTRUTURADO},
                {"termo_encerramento", "Termo de encerramento", TEXTO_LIVRE},
                {"justificativas_projeto", "Justificativas do projeto", TEXTO_LIVRE},
                {"impactos_projeto", "Impactos do projeto", TEXTO_LIVRE},
                {"indicadores_projeto", "Indicadores (KPIs)", TEXTO_LIVRE},
                {"artefatos_produzidos", "Artefatos produzidos", TEXTO_LIVRE},
                {"imagens_fotos", "Imagens/fotos", FORA_DE_ESCOPO},
        }));
        cats.add(cat("stakeholders", "Stakeholders", 2, new String[][]{
                {"nome_stakeholders", "Stakeholders", ESTRUTURADO},
                {"funcao_projeto", "Funções no projeto", ESTRUTURADO},
                {"publico_alvo", "Público-alvo", TEXTO_LIVRE},
                {"detalhes_equipe", "Detalhes da equipe", TEXTO_LIVRE},
                {"treinamentos_equipes", "Treinamentos das equipes", TEXTO_LIVRE},
        }));
        cats.add(cat("escopo", "Escopo", 3, new String[][]{
                {"tarefas_projeto", "Tarefas do projeto", TEXTO_LIVRE},
                {"requisitos", "Requisitos", TEXTO_LIVRE},
                {"escopo_planejado", "Escopo planejado", TEXTO_LIVRE},
                {"escopo_executado", "Escopo executado", TEXTO_LIVRE},
        }));
        cats.add(cat("cronograma", "Cronograma", 4, new String[][]{
                {"data_inicio", "Data de início", ESTRUTURADO},
                {"data_fim_planejada", "Data fim (planejada)", ESTRUTURADO},
                {"data_fim_executada", "Data fim (executada)", ESTRUTURADO},
                {"entregas_realizadas", "Entregas realizadas", TEXTO_LIVRE},
                {"status_cronograma", "Status do cronograma", ESTRUTURADO},
        }));
        cats.add(cat("custos", "Custos", 5, new String[][]{
                {"custo_estimado", "Custo estimado", ESTRUTURADO},
                {"custo_realizado", "Custo realizado", ESTRUTURADO},
                {"justificativas_gastos", "Justificativas dos gastos", TEXTO_LIVRE},
        }));
        cats.add(cat("riscos", "Riscos", 6, new String[][]{
                {"riscos_identificados", "Riscos identificados", TEXTO_LIVRE},
                {"analise_qualitativa_riscos", "Análise qualitativa de riscos", TEXTO_LIVRE},
                {"analise_quantitativa_riscos", "Análise quantitativa de riscos", TEXTO_LIVRE},
                {"planejamento_respostas_riscos", "Planejamento de respostas a riscos", TEXTO_LIVRE},
                {"monitoramento_riscos", "Monitoramento de riscos", TEXTO_LIVRE},
        }));
        cats.add(cat("mudancas", "Mudanças", 7, new String[][]{
                {"custo_implementacao_mudanca", "Custo de implementação da mudança", ESTRUTURADO},
                {"analise_custo_beneficio", "Análise custo-benefício", TEXTO_LIVRE},
                {"impactos_mudanca", "Impactos da mudança", TEXTO_LIVRE},
        }));
        cats.add(cat("licoes_aprendidas", "Lições aprendidas", 8, new String[][]{
                {"pontos_fortes", "Pontos fortes", TEXTO_LIVRE},
                {"pontos_fracos", "Pontos fracos", TEXTO_LIVRE},
                {"dificuldades_encontradas", "Dificuldades encontradas", TEXTO_LIVRE},
                {"providencias_tomadas", "Providências tomadas", TEXTO_LIVRE},
        }));
        return cats;
    }

    private static MpoCategoryDTO cat(String key, String label, int order, String[][] attrs) {
        List<MpoAttributeDTO> list = new ArrayList<>();
        for (String[] a : attrs) {
            list.add(new MpoAttributeDTO(a[0], a[1], key, label, a[2]));
        }
        return new MpoCategoryDTO(key, label, order, list);
    }
}
