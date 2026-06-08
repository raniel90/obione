import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFeed } from "./feed";

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const EVENT = {
  kind: "new_comment",
  project_id: "p1",
  project_name: "Freire Batista ADV",
  actor_id: "u1",
  target_id: "c1",
  created_at: "2026-06-01T00:00:00Z",
  summary: "Comentário de teste",
};

describe("feed API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("getFeed GETs /feed", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ events: [EVENT] }));
    await getFeed();
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/feed$/);
    expect((init as RequestInit).method).toBeUndefined();
  });

  it("getFeed unwraps and returns the events array", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ events: [EVENT] }));
    const out = await getFeed();
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(1);
    expect(out[0].project_name).toBe("Freire Batista ADV");
  });
});
