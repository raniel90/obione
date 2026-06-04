import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import * as portfolioApi from "@/lib/api/portfolio";
import { PortfolioCockpitPage } from "./PortfolioCockpitPage";
import type { Cockpit } from "@/lib/api/types";

const COCKPIT: Cockpit = {
  total_projects: 4,
  avg_coverage_overall: 55,
  status_distribution: { registered: 1, extracted: 1, reviewed: 2 },
  themes: [
    {
      domain: "legal",
      count: 3,
      avg_coverage: 62,
      status_distribution: { registered: 1, extracted: 1, reviewed: 1 },
      reviewed_pct: 33.33,
    },
    {
      domain: "health",
      count: 1,
      avg_coverage: 48,
      status_distribution: { registered: 0, extracted: 0, reviewed: 1 },
      reviewed_pct: 100,
    },
  ],
};

const MATRIX = {
  categories: ["conteudo_geral", "riscos"],
  rows: [
    { project_id: "p1", project_name: "Projeto Um", domain: "legal" as const, coverages: { conteudo_geral: 90, riscos: 20 } },
  ],
};

function setup() {
  // Default: an empty matrix so the heatmap query never hits the network.
  if (!vi.isMockFunction(portfolioApi.getCoverageMatrix)) {
    vi.spyOn(portfolioApi, "getCoverageMatrix").mockResolvedValue({ categories: [], rows: [] });
  }
  return renderWithProviders(<PortfolioCockpitPage />);
}

describe("PortfolioCockpitPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders KPIs and the theme table", async () => {
    vi.spyOn(portfolioApi, "getCockpit").mockResolvedValue(COCKPIT);
    setup();
    await waitFor(() => expect(screen.getByText("Cockpit do Portfólio")).toBeInTheDocument());
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Jurídico")).toBeInTheDocument();
    expect(screen.getByText("Saúde")).toBeInTheDocument();
  });

  it("shows an empty state when there are no projects", async () => {
    vi.spyOn(portfolioApi, "getCockpit").mockResolvedValue({
      total_projects: 0,
      avg_coverage_overall: 0,
      status_distribution: { registered: 0, extracted: 0, reviewed: 0 },
      themes: [],
    });
    setup();
    await waitFor(() =>
      expect(screen.getByText(/nenhum projeto no portfólio ainda/i)).toBeInTheDocument(),
    );
  });

  it("shows an error state with retry when the query fails", async () => {
    vi.spyOn(portfolioApi, "getCockpit").mockRejectedValue(new Error("boom"));
    setup();
    await waitFor(() =>
      expect(screen.getByText(/erro ao carregar o cockpit/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });

  it("renders the coverage heatmap section", async () => {
    vi.spyOn(portfolioApi, "getCockpit").mockResolvedValue(COCKPIT);
    vi.spyOn(portfolioApi, "getCoverageMatrix").mockResolvedValue(MATRIX);
    setup();
    await waitFor(() =>
      expect(screen.getByText("Cobertura por categoria")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText("90%")).toBeInTheDocument());
    expect(screen.getByRole("rowheader", { name: "Projeto Um" })).toBeInTheDocument();
  });
});
