import { afterEach, describe, it, expect, beforeEach, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth-context";
import * as authApi from "./api/auth";
import { TOKEN_STORAGE_KEY } from "./api/token";

const FAKE_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "c@x.com",
  name: "Consultor",
  role: "consultant" as const,
  created_at: "2026-06-01T00:00:00Z",
};

function Probe() {
  const a = useAuth();
  return (
    <div>
      <span data-testid="status">{a.status}</span>
      {a.status === "authenticated" && <span data-testid="email">{a.user.email}</span>}
      <button onClick={() => a.login("c@x.com", "pwd12345678")}>login</button>
      <button onClick={() => a.logout()}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("starts loading, then resolves to unauthenticated when no token", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status").textContent).toBe("loading");
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated"),
    );
  });

  it("bootstraps to authenticated when a token is in localStorage and /me succeeds", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "good");
    vi.spyOn(authApi, "me").mockResolvedValue(FAKE_USER);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );
    expect(screen.getByTestId("email").textContent).toBe("c@x.com");
  });

  it("falls back to unauthenticated when /me throws (stale token)", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "stale");
    vi.spyOn(authApi, "me").mockRejectedValue(new Error("401"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated"),
    );
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("login stores token, calls /me and transitions to authenticated", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      access_token: "t",
      token_type: "bearer",
      expires_in: 3600,
    });
    vi.spyOn(authApi, "me").mockResolvedValue(FAKE_USER);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated"),
    );

    await act(async () => {
      screen.getByText("login").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("t");
  });

  it("logout clears token and transitions to unauthenticated", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "good");
    vi.spyOn(authApi, "me").mockResolvedValue(FAKE_USER);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
