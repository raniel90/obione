import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCockpit, getCoverageMatrix } from "./portfolio";

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const COCKPIT = {
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
  ],
};

describe("portfolio API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("getCockpit GETs /portfolio/cockpit and returns the cockpit", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(COCKPIT));
    const out = await getCockpit();
    expect(out.total_projects).toBe(4);
    expect(out.themes).toHaveLength(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/portfolio\/cockpit$/);
    expect((init as RequestInit).method).toBeUndefined();
  });

  it("getCoverageMatrix GETs /portfolio/coverage-matrix and returns it", async () => {
    const matrix = {
      categories: ["conteudo_geral", "riscos"],
      rows: [
        { project_id: "p1", project_name: "P1", domain: "legal", coverages: { conteudo_geral: 80, riscos: 20 } },
      ],
    };
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(matrix));
    const out = await getCoverageMatrix();
    expect(out.rows).toHaveLength(1);
    expect(out.categories).toContain("riscos");
    const [url] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/portfolio\/coverage-matrix$/);
  });
});
