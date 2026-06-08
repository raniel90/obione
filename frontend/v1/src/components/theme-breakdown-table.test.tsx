import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "@/test/render";
import { ThemeBreakdownTable } from "./theme-breakdown-table";
import type { ThemeBreakdown } from "@/lib/api/types";

const THEMES: ThemeBreakdown[] = [
  {
    domain: "legal",
    count: 3,
    avg_coverage: 62,
    status_distribution: { registered: 1, extracted: 1, reviewed: 1 },
    reviewed_pct: 33.33,
  },
  {
    domain: "health",
    count: 2,
    avg_coverage: 48,
    status_distribution: { registered: 0, extracted: 1, reviewed: 1 },
    reviewed_pct: 50,
  },
];

describe("ThemeBreakdownTable", () => {
  it("renders a row per theme with label, coverage and reviewed %", () => {
    renderWithRouter(<ThemeBreakdownTable themes={THEMES} />);
    expect(screen.getByText("Jurídico")).toBeInTheDocument();
    expect(screen.getByText("Saúde")).toBeInTheDocument();
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("links each theme to the filtered projects list", () => {
    renderWithRouter(<ThemeBreakdownTable themes={THEMES} />);
    expect(screen.getByRole("link", { name: "Jurídico" })).toHaveAttribute(
      "href",
      "/projects?domain=legal",
    );
    expect(screen.getByRole("link", { name: "Saúde" })).toHaveAttribute(
      "href",
      "/projects?domain=health",
    );
  });
});
