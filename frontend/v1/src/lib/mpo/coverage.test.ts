import { describe, it, expect } from "vitest";
import { categoryCoverage } from "./coverage";

describe("categoryCoverage", () => {
  it("computes filled/total per category, excluding out-of-scope from total", () => {
    const content = {
      custo_estimado: 1000,
      custo_realizado: 800,
      justificativas_gastos: null,
    };
    const cov = categoryCoverage(content);
    expect(cov.custos).toEqual({ filled: 2, total: 3, percentage: 67 });
  });

  it("computes conteudo_geral total from in-scope attributes only", () => {
    const content: Record<string, unknown> = {};
    const cov = categoryCoverage(content);
    expect(cov.conteudo_geral.total).toBe(14);
    expect(cov.conteudo_geral.filled).toBe(0);
    expect(cov.conteudo_geral.percentage).toBe(0);
  });

  it("counts a non-null value as filled (including empty array)", () => {
    const content = { nome_stakeholders: [], funcao_projeto: ["Gerente"] };
    const cov = categoryCoverage(content);
    expect(cov.stakeholders.filled).toBe(2);
    expect(cov.stakeholders.total).toBe(5);
  });
});
