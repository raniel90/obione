import { describe, it, expect, beforeEach, vi } from "vitest";
import { listComments, createComment, updateComment, deleteComment } from "./comments";

function ok(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const C = {
  id: "c1",
  project_id: "p1",
  author_id: "u1",
  parent_id: null,
  body: "Olá",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

describe("comments API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("listComments GETs /projects/{id}/comments", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([C]));
    const out = await listComments("p1");
    expect(out).toHaveLength(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/comments$/);
    expect((init as RequestInit).method).toBeUndefined();
  });

  it("createComment POSTs /projects/{id}/comments with {body}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok(C, 201));
    await createComment("p1", "Olá");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/comments$/);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify({ body: "Olá" }));
  });

  it("updateComment PATCHs /comments/{id} with {body}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ ...C, body: "Editado" }));
    await updateComment("c1", "Editado");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/comments\/c1$/);
    expect((init as RequestInit).method).toBe("PATCH");
    expect((init as RequestInit).body).toBe(JSON.stringify({ body: "Editado" }));
  });

  it("deleteComment DELETEs /comments/{id}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await deleteComment("c1");
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/comments\/c1$/);
    expect((init as RequestInit).method).toBe("DELETE");
  });
});
