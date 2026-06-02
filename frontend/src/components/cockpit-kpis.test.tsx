import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CockpitKpis } from "./cockpit-kpis";

describe("CockpitKpis", () => {
  it("renders total, rounded average coverage and status counts", () => {
    render(
      <CockpitKpis
        totalProjects={4}
        avgCoverage={55.4}
        status={{ registered: 1, extracted: 1, reviewed: 2 }}
      />,
    );
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByText(/Registrados 1/)).toBeInTheDocument();
    expect(screen.getByText(/Extraídos 1/)).toBeInTheDocument();
    expect(screen.getByText(/Revisados 2/)).toBeInTheDocument();
  });
});
