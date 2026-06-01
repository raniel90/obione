import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "./client";
import { ApiError } from "./error";
import { TOKEN_STORAGE_KEY, setStoredToken } from "./token";

function mockResponse(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("calls fetch with JSON content type and returns parsed json", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({ ok: true }));
    const out = await api<{ ok: boolean }>("/x");
    expect(out).toEqual({ ok: true });
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).headers).toEqual(
      expect.objectContaining({ "Content-Type": "application/json" }),
    );
  });

  it("attaches Bearer token when stored", async () => {
    setStoredToken("tkn123");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({}, 200));
    await api("/x");
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).headers).toEqual(
      expect.objectContaining({ Authorization: "Bearer tkn123" }),
    );
  });

  it("omits Authorization header when no token is stored", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({}, 200));
    await api("/x");
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).headers).not.toEqual(
      expect.objectContaining({ Authorization: expect.anything() }),
    );
  });

  it("throws ApiError with code from response body on 4xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse({ error: { code: "bad_request", message: "boom" } }, 400),
    );
    await expect(api("/x")).rejects.toMatchObject({
      status: 400,
      code: "bad_request",
      message: "boom",
    });
  });

  it("falls back to generic code/message when body is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    await expect(api("/x")).rejects.toMatchObject({
      status: 500,
      code: "unknown",
    });
  });

  it("clears the stored token and throws on 401", async () => {
    setStoredToken("stale");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
    await expect(api("/x")).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("returns undefined on 204", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const out = await api<void>("/x");
    expect(out).toBeUndefined();
  });

  it("wraps network failures in ApiError with code 'network_error'", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api("/x")).rejects.toMatchObject({
      status: 0,
      code: "network_error",
    });
  });

  it("forwards body and method in init", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({}, 200));
    await api("/x", { method: "POST", body: JSON.stringify({ a: 1 }) });
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify({ a: 1 }));
  });
});
