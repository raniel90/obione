import { describe, it, expect, beforeEach, vi } from "vitest";
import { listDrafts, generateDrafts, updateDraft, deleteDraft, publishDraft } from "./drafts";

function ok(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const D = {
  id: "d1",
  project_id: "p1",
  source_extraction_id: "e1",
  kind: "next_step",
  title: "Passo",
  body: "Fazer X",
  status: "draft",
  llm_model: "mock-drafts-v1",
  generated_by: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

describe("drafts API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("listDrafts GETs /projects/{id}/drafts", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([D]));
    const out = await listDrafts("p1");
    expect(out).toHaveLength(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/drafts$/);
    expect((init as RequestInit).method).toBeUndefined();
  });

  it("generateDrafts POSTs /projects/{id}/drafts/generate with no body", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([D], 201));
    const out = await generateDrafts("p1");
    expect(out).toHaveLength(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/drafts\/generate$/);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBeUndefined();
  });

  it("updateDraft PATCHs /drafts/{id} with the patch", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ ...D, body: "Novo" }));
    await updateDraft("d1", { title: "T", body: "Novo" });
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/drafts\/d1$/);
    expect((init as RequestInit).method).toBe("PATCH");
    expect((init as RequestInit).body).toBe(JSON.stringify({ title: "T", body: "Novo" }));
  });

  it("deleteDraft DELETEs /drafts/{id}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await deleteDraft("d1");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/drafts\/d1$/);
    expect((init as RequestInit).method).toBe("DELETE");
  });

  it("publishDraft POSTs /drafts/{id}/publish", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ ...D, status: "published" }));
    const out = await publishDraft("d1");
    expect(out.status).toBe("published");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/drafts\/d1\/publish$/);
    expect((init as RequestInit).method).toBe("POST");
  });
});
