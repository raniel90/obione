import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getVisibilityState,
  setCategoryVisibility,
  setAttributeOverride,
  deleteAttributeOverride,
} from "./visibility";

function ok(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const STATE = {
  categories: [{ category_key: "conteudo_geral", visible: true, updated_at: "2026-06-01T00:00:00Z" }],
  overrides: [{ attribute_key: "licitacao", visible: false, updated_at: "2026-06-01T00:00:00Z" }],
  resolved: { nome_projeto: true, licitacao: false },
};

describe("visibility API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("getVisibilityState GETs /projects/{id}/visibility", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(STATE));
    const out = await getVisibilityState("p1");
    expect(out.resolved.nome_projeto).toBe(true);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/visibility$/);
    expect((init as RequestInit).method).toBeUndefined();
  });

  it("setCategoryVisibility PUTs /categories/{key} with {visible}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await setCategoryVisibility("p1", "custos", true);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/visibility\/categories\/custos$/);
    expect((init as RequestInit).method).toBe("PUT");
    expect((init as RequestInit).body).toBe(JSON.stringify({ visible: true }));
  });

  it("setAttributeOverride PUTs /attributes/{key} with {visible}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await setAttributeOverride("p1", "licitacao", false);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/visibility\/attributes\/licitacao$/);
    expect((init as RequestInit).method).toBe("PUT");
    expect((init as RequestInit).body).toBe(JSON.stringify({ visible: false }));
  });

  it("deleteAttributeOverride DELETEs /attributes/{key}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await deleteAttributeOverride("p1", "licitacao");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/visibility\/attributes\/licitacao$/);
    expect((init as RequestInit).method).toBe("DELETE");
  });
});
