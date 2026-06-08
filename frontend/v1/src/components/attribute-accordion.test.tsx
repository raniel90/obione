import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttributeAccordion } from "./attribute-accordion";
import type { GroupedCategory } from "@/lib/mpo/group-attributes";

const CATEGORIES: GroupedCategory[] = [
  {
    key: "conteudo_geral",
    label: "Conteúdo geral",
    attributes: [{ key: "nome_projeto", label: "Nome do projeto", renderType: "text", value: "Projeto X" }],
  },
  {
    key: "custos",
    label: "Custos",
    attributes: [{ key: "custo_estimado", label: "Custo estimado", renderType: "currency", value: 1000 }],
  },
];

describe("AttributeAccordion", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders each category label with its attribute count", () => {
    render(<AttributeAccordion categories={CATEGORIES} />);
    expect(screen.getByText(/Conteúdo geral \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Custos \(1\)/)).toBeInTheDocument();
  });

  it("renders attribute rows (open by default)", () => {
    render(<AttributeAccordion categories={CATEGORIES} />);
    expect(screen.getByText("Nome do projeto")).toBeInTheDocument();
    expect(screen.getByText("Projeto X")).toBeInTheDocument();
  });

  it("shows per-category percentage when coverage is provided", () => {
    render(
      <AttributeAccordion
        categories={CATEGORIES}
        coverageByCategory={{ conteudo_geral: { filled: 1, total: 14, percentage: 7 }, custos: { filled: 1, total: 3, percentage: 33 } }}
      />,
    );
    expect(screen.getByText("7%")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("omits per-category percentage when coverage is absent (client)", () => {
    render(<AttributeAccordion categories={CATEGORIES} />);
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });
});
