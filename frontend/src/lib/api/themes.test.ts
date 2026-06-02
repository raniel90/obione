import { describe, it, expect, beforeEach, vi } from "vitest";
import { listThemeSuggestions, suggestTheme, acceptThemeSuggestion } from "./themes";

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SUGG = {
  id: "s1",
  project_id: "p1",
  suggested_domain: "legal",
  confidence: 0.9,
  model_id: "mock",
  reasoning: null,
  accepted: false,
  accepted_by: null,
  accepted_at: null,
  created_at: "2026-06-01T00:00:00Z",
};

describe("themes API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("listThemeSuggestions GETs /projects/{id}/themes/suggestions", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([SUGG]));
    const out = await listThemeSuggestions("p1");
    expect(out).toHaveLength(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/themes\/suggestions$/);
    expect((init as RequestInit).method).toBeUndefined();
  });

  it("suggestTheme POSTs /projects/{id}/themes/suggest with no body", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(SUGG, 201));
    const out = await suggestTheme("p1");
    expect(out.suggested_domain).toBe("legal");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/themes\/suggest$/);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBeUndefined();
  });

  it("acceptThemeSuggestion POSTs /themes/suggestions/{id}/accept", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(ok({ ...SUGG, accepted: true }, 200));
    const out = await acceptThemeSuggestion("s1");
    expect(out.accepted).toBe(true);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/themes\/suggestions\/s1\/accept$/);
    expect((init as RequestInit).method).toBe("POST");
  });
});
