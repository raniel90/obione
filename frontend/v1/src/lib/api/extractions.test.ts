import { describe, it, expect, beforeEach, vi } from "vitest";
import { listExtractions, runExtraction } from "./extractions";

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("extractions API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("listExtractions GETs /projects/{id}/extractions and returns the runs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      ok([{ id: "e1", project_id: "p1", source: "llm", llm_model: "m", source_description_hash: null, content: { _meta: {} }, created_at: "2026-06-01T00:00:00Z" }]),
    );
    const out = await listExtractions("p1");
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("llm");
    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/extractions$/);
  });

  it("runExtraction POSTs /projects/{id}/extractions and returns the run", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      ok({ id: "e2", project_id: "p1", source: "llm", llm_model: "m", source_description_hash: "h", content: { _meta: {} }, created_at: "2026-06-03T00:00:00Z" }),
    );
    const out = await runExtraction("p1");
    expect(out.id).toBe("e2");
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/extractions$/);
    expect((init as RequestInit).method).toBe("POST");
  });
});
