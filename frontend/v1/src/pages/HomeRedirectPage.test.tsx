import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithRouter } from "@/test/render";
import { AuthProvider } from "@/lib/auth-context";
import * as authApi from "@/lib/api/auth";
import { TOKEN_STORAGE_KEY } from "@/lib/api/token";
import { HomeRedirectPage } from "./HomeRedirectPage";

const USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "x@x.com",
  name: "X",
  created_at: "2026-06-01T00:00:00Z",
};

function setup(role: "consultant" | "client" | "admin") {
  localStorage.setItem(TOKEN_STORAGE_KEY, "good");
  vi.spyOn(authApi, "me").mockResolvedValue({ ...USER, role });
  return renderWithRouter(
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRedirectPage />} />
        <Route path="/portfolio/cockpit" element={<div data-testid="cockpit">cockpit</div>} />
        <Route path="/projects" element={<div data-testid="projects">projects</div>} />
      </Routes>
    </AuthProvider>,
  );
}

describe("HomeRedirectPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("sends consultant to /portfolio/cockpit", async () => {
    setup("consultant");
    await waitFor(() => expect(screen.getByTestId("cockpit")).toBeInTheDocument());
  });

  it("sends admin to /portfolio/cockpit", async () => {
    setup("admin");
    await waitFor(() => expect(screen.getByTestId("cockpit")).toBeInTheDocument());
  });

  it("sends client to /projects", async () => {
    setup("client");
    await waitFor(() => expect(screen.getByTestId("projects")).toBeInTheDocument());
  });
});
