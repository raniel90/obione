import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithRouter } from "@/test/render";
import { AuthProvider } from "@/lib/auth-context";
import * as authApi from "@/lib/api/auth";
import { TOKEN_STORAGE_KEY } from "@/lib/api/token";
import { RequireAuth } from "./require-auth";

const FAKE_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "c@x.com",
  name: "Consultor",
  role: "consultant" as const,
  created_at: "2026-06-01T00:00:00Z",
};

function setup(initial = "/") {
  return renderWithRouter(
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <div data-testid="protected">protected</div>
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>,
    { initialEntries: [initial] },
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders a loading state while AuthProvider is bootstrapping", () => {
    setup();
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", async () => {
    setup();
    await waitFor(() => expect(screen.getByTestId("login-page")).toBeInTheDocument());
  });

  it("renders children when authenticated", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "good");
    vi.spyOn(authApi, "me").mockResolvedValue(FAKE_USER);
    setup();
    await waitFor(() => expect(screen.getByTestId("protected")).toBeInTheDocument());
  });
});
