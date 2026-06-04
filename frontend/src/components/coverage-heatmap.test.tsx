import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "@/test/render";
import { CoverageHeatmap } from "./coverage-heatmap";
import type { CoverageMatrix } from "@/lib/api/types";

const DATA: CoverageMatrix = {
  categories: ["conteudo_geral", "riscos"],
  rows: [
    { project_id: "p1", project_name: "Projeto Um", domain: "legal", coverages: { conteudo_geral: 90, riscos: 10 } },
    { project_id: "p2", project_name: "Projeto Dois", domain: "health", coverages: { conteudo_geral: 55, riscos: 0 } },
  ],
};

describe("CoverageHeatmap", () => {
  it("renders category labels (columns) and a row per project", () => {
    renderWithRouter(<CoverageHeatmap data={DATA} />);
    expect(screen.getByText("Conteúdo geral")).toBeInTheDocument();
    expect(screen.getByText("Riscos")).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Projeto Um" })).toHaveAttribute(
      "href",
      "/projects/p1",
    );
    expect(screen.getByRole("rowheader", { name: "Projeto Dois" })).toBeInTheDocument();
  });

  it("colors cells by coverage bucket and links each to its project", () => {
    renderWithRouter(<CoverageHeatmap data={DATA} />);
    const high = screen.getByText("90%");
    const low = screen.getByText("10%");
    const partial = screen.getByText("55%");
    expect(high).toHaveClass("bg-success");
    expect(partial).toHaveClass("bg-warning");
    expect(low).toHaveClass("bg-muted");
    expect(high).toHaveAttribute("href", "/projects/p1");
  });
});
