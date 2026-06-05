import { describe, it, expect } from "vitest";
import { CATEGORIES, DOMAIN_LABELS, PORTE_LABELS, STATUS_CRONOGRAMA_LABELS } from "./catalog";

describe("MPO catalog", () => {
  it("has 8 categories in MPO order", () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual([
      "conteudo_geral",
      "stakeholders",
      "escopo",
      "cronograma",
      "custos",
      "riscos",
      "mudancas",
      "licoes_aprendidas",
    ]);
  });

  it("has exactly 43 in-scope attributes across all categories", () => {
    const total = CATEGORIES.reduce((n, c) => n + c.attributes.length, 0);
    expect(total).toBe(43);
  });

  it("has unique attribute keys", () => {
    const keys = CATEGORIES.flatMap((c) => c.attributes.map((a) => a.key));
    expect(new Set(keys).size).toBe(43);
  });

  it("maps every domain to a PT-BR label", () => {
    expect(DOMAIN_LABELS.legal).toBe("Jurídico");
    expect(DOMAIN_LABELS.gastronomy).toBe("Gastronomia");
  });

  it("maps porte and status_cronograma enums", () => {
    expect(PORTE_LABELS.medio).toBe("Médio");
    expect(STATUS_CRONOGRAMA_LABELS.no_prazo).toBe("No prazo");
  });
});
