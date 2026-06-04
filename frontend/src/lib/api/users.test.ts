import { describe, it, expect, beforeEach, vi } from "vitest";
import { listUsers, listClients } from "./users";

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const CLIENT = {
  id: "u1",
  email: "cliente1@obione.dev",
  name: "Cliente 1",
  role: "client",
  created_at: "2026-06-01T00:00:00Z",
};

describe("users API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("listUsers GETs /auth/users (no query when role omitted)", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([CLIENT]));
    await listUsers();
    const [url] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/users$/);
  });

  it("listClients GETs /auth/users?role=client and returns the array", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([CLIENT]));
    const out = await listClients();
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe("client");
    const [url] = spy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/users\?role=client$/);
  });
});
