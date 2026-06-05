import { describe, it, expect } from "vitest";
import { groupAttributes } from "./group-attributes";

const META = { origem: "llm", projeto_nome: "X", documento_fonte: "x.docx", data_extracao: "2026-06-01T00:00:00Z" };

describe("groupAttributes", () => {
  it("groups consultant content (all in-scope keys) into 8 categories in order", () => {
    const content: Record<string, unknown> = { _meta: META };
    for (const key of [
      "nome_projeto","descricao","local_execucao","tipo","porte","objetivos","descricao_produtos_servicos",
      "licitacao","contratos","termo_encerramento","justificativas_projeto","impactos_projeto",
      "indicadores_projeto","artefatos_produzidos","nome_stakeholders","funcao_projeto",
      "publico_alvo","detalhes_equipe","treinamentos_equipes","tarefas_projeto","requisitos","escopo_planejado",
      "escopo_executado","data_inicio","data_fim_planejada","data_fim_executada","entregas_realizadas",
      "status_cronograma","custo_estimado","custo_realizado","justificativas_gastos","riscos_identificados",
      "analise_qualitativa_riscos","analise_quantitativa_riscos","planejamento_respostas_riscos",
      "monitoramento_riscos","custo_implementacao_mudanca","analise_custo_beneficio","impactos_mudanca",
      "pontos_fortes","pontos_fracos","dificuldades_encontradas","providencias_tomadas",
    ]) {
      content[key] = null;
    }
    const groups = groupAttributes(content);
    expect(groups.map((g) => g.key)).toEqual([
      "conteudo_geral","stakeholders","escopo","cronograma","custos","riscos","mudancas","licoes_aprendidas",
    ]);
    expect(groups[0].attributes.length).toBe(14);
  });

  it("never emits _meta as an attribute", () => {
    const content = { _meta: META, nome_projeto: "Projeto X" };
    const groups = groupAttributes(content);
    const allKeys = groups.flatMap((g) => g.attributes.map((a) => a.key));
    expect(allKeys).not.toContain("_meta");
    expect(allKeys).toContain("nome_projeto");
  });

  it("drops categories with no present keys (client CBAC view)", () => {
    const content = { _meta: META, nome_projeto: "Projeto X", objetivos: "Crescer" };
    const groups = groupAttributes(content);
    expect(groups.map((g) => g.key)).toEqual(["conteudo_geral"]);
    expect(groups[0].attributes.map((a) => a.key)).toEqual(["nome_projeto", "objetivos"]);
  });

  it("preserves a present-but-null attribute (shown as '—' later)", () => {
    const content = { _meta: META, nome_projeto: null };
    const groups = groupAttributes(content);
    expect(groups[0].attributes[0]).toMatchObject({ key: "nome_projeto", value: null });
  });

  it("carries label and renderType from the catalog", () => {
    const content = { _meta: META, custo_estimado: 1000 };
    const groups = groupAttributes(content);
    expect(groups[0].attributes[0]).toMatchObject({
      key: "custo_estimado",
      label: "Custo estimado",
      renderType: "currency",
      value: 1000,
    });
  });
});
