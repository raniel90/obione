import { describe, it, expect, beforeEach, vi } from "vitest";
import { listProjects, getProjectDetail, createProject, addProjectClient } from "./projects";

function ok(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("projects API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("listProjects GETs /projects and returns the array", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      ok([{ id: "p1", name: "Projeto X", domain: "legal", description: "d", consultant_id: "c1", created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" }]),
    );
    const out = await listProjects();
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Projeto X");
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects$/);
    expect((init as RequestInit).method).toBeUndefined();
  });

  it("getProjectDetail GETs /projects/{id}/detail", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      ok({ project: { id: "p1" }, coverage: { percentage: 50 }, recent_comments: [], counts: { extractions: 1, comments: 0 } }),
    );
    const out = await getProjectDetail("p1");
    expect(out.coverage.percentage).toBe(50);
    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/detail$/);
  });

  it("createProject POSTs /projects with the body and returns the project", async () => {
    const body = { name: "Novo", domain: "legal" as const, description: "x".repeat(200) };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      ok({ id: "p9", ...body, consultant_id: "c1", created_at: "2026-06-03T00:00:00Z", updated_at: "2026-06-03T00:00:00Z" }, 201),
    );
    const out = await createProject(body);
    expect(out.id).toBe("p9");
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects$/);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify(body));
  });

  it("addProjectClient POSTs /projects/{id}/clients with {user_id}", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ linked: true }, 201));
    await addProjectClient("p1", "u7");
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/projects\/p1\/clients$/);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify({ user_id: "u7" }));
  });
});
