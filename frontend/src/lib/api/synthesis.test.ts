import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listSyntheses,
  generateSynthesis,
  listProjectSyntheses,
  updateSynthesis,
  deleteSynthesis,
  publishSynthesis,
} from "./synthesis";

function ok(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const S = {
  id: "s1",
  domain: "legal",
  title: "Síntese — Jurídico",
  body: "corpo",
  status: "draft",
  source_project_ids: ["p1", "p2"],
  llm_model: "mock-synthesis-v1",
  generated_by: "c1",
  reviewed_by: null,
  reviewed_at: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

describe("synthesis API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("listSyntheses GETs /themes/{domain}/syntheses", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([S]));
    const out = await listSyntheses("legal");
    expect(out).toHaveLength(1);
    expect(String(spy.mock.calls[0]![0])).toMatch(/\/themes\/legal\/syntheses$/);
  });

  it("generateSynthesis POSTs /themes/{domain}/syntheses/generate", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(S, 201));
    await generateSynthesis("legal");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/themes\/legal\/syntheses\/generate$/);
    expect((init as RequestInit).method).toBe("POST");
  });

  it("listProjectSyntheses GETs /projects/{id}/syntheses", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([S]));
    await listProjectSyntheses("p1");
    expect(String(spy.mock.calls[0]![0])).toMatch(/\/projects\/p1\/syntheses$/);
  });

  it("updateSynthesis PATCHes /syntheses/{id}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(S));
    await updateSynthesis("s1", { body: "novo" });
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/syntheses\/s1$/);
    expect((init as RequestInit).method).toBe("PATCH");
  });

  it("deleteSynthesis DELETEs /syntheses/{id}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(null, 204));
    await deleteSynthesis("s1");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/syntheses\/s1$/);
    expect((init as RequestInit).method).toBe("DELETE");
  });

  it("publishSynthesis POSTs /syntheses/{id}/publish", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ ...S, status: "published" }));
    const out = await publishSynthesis("s1");
    expect(out.status).toBe("published");
    expect(String(spy.mock.calls[0]![0])).toMatch(/\/syntheses\/s1\/publish$/);
  });
});
