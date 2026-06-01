import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithRouter } from "@/test/render";
import { AuthProvider } from "@/lib/auth-context";
import * as authApi from "@/lib/api/auth";
import { TOKEN_STORAGE_KEY } from "@/lib/api/token";
import type { User } from "@/lib/api/types";
import { RequireRole } from "./require-role";

const CONSULTANT: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "c@x.com",
  name: "C",
  role: "consultant",
  created_at: "2026-06-01T00:00:00Z",
};

const CLIENT: User = { ...CONSULTANT, id: "00000000-0000-0000-0000-000000000002", email: "cli@x.com", role: "client" };

function setup(opts: { user: User; allowed: "consultant" | "client" | "admin" }) {
  localStorage.setItem(TOKEN_STORAGE_KEY, "good");
  vi.spyOn(authApi, "me").mockResolvedValue(opts.user);
  return renderWithRouter(
    <AuthProvider>
      <Routes>
        <Route path="/" element={<div data-testid="home">home</div>} />
        <Route
          path="/restricted"
          element={
            <RequireRole role={opts.allowed}>
              <div data-testid="restricted">restricted</div>
            </RequireRole>
          }
        />
      </Routes>
    </AuthProvider>,
    { initialEntries: ["/restricted"] },
  );
}

describe("RequireRole", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders children when role matches", async () => {
    setup({ user: CONSULTANT, allowed: "consultant" });
    await waitFor(() => expect(screen.getByTestId("restricted")).toBeInTheDocument());
  });

  it("redirects to / when role does not match", async () => {
    setup({ user: CLIENT, allowed: "consultant" });
    await waitFor(() => expect(screen.getByTestId("home")).toBeInTheDocument());
  });
});
