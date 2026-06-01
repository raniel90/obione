import { describe, it, expect, beforeEach, vi } from "vitest";
import { login, me } from "./auth";

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("auth API module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("login POSTs /auth/login with credentials and returns the token response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      ok({ access_token: "t", token_type: "bearer", expires_in: 3600 }),
    );
    const out = await login({ email: "a@b.com", password: "pwd12345678" });
    expect(out).toEqual({ access_token: "t", token_type: "bearer", expires_in: 3600 });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/login$/);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(
      JSON.stringify({ email: "a@b.com", password: "pwd12345678" }),
    );
  });

  it("me GETs /auth/me and returns the user", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      ok({
        id: "00000000-0000-0000-0000-000000000001",
        email: "c@x.com",
        name: "Consultor",
        role: "consultant",
        created_at: "2026-06-01T00:00:00Z",
      }),
    );
    const u = await me();
    expect(u.email).toBe("c@x.com");
    expect(u.role).toBe("consultant");
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/me$/);
    expect((init as RequestInit).method).toBeUndefined();
  });
});
