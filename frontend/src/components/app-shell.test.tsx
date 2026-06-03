import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithRouter } from "@/test/render";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import * as authApi from "@/lib/api/auth";
import { TOKEN_STORAGE_KEY } from "@/lib/api/token";
import type { User } from "@/lib/api/types";
import { AppShell } from "./app-shell";

const CONSULTANT: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "consultor@obione.dev",
  name: "Ana Consultora",
  role: "consultant",
  created_at: "2026-06-01T00:00:00Z",
};

const CLIENT: User = {
  ...CONSULTANT,
  id: "00000000-0000-0000-0000-000000000002",
  email: "cliente1@obione.dev",
  name: "Bruno Cliente",
  role: "client",
};

function setup(user: User) {
  localStorage.setItem(TOKEN_STORAGE_KEY, "good");
  vi.spyOn(authApi, "me").mockResolvedValue(user);
  return renderWithRouter(
    <ThemeProvider>
      <AuthProvider>
        <AppShell>
          <div data-testid="content">conteúdo</div>
        </AppShell>
      </AuthProvider>
    </ThemeProvider>,
    { initialEntries: ["/projects"] },
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders its children inside the content area", async () => {
    setup(CONSULTANT);
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("links the logo back to the home route", async () => {
    setup(CONSULTANT);
    expect(screen.getByRole("link", { name: /obione — início/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("always shows Projetos and Novidades nav links", async () => {
    setup(CONSULTANT);
    expect(screen.getByRole("link", { name: "Projetos" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByRole("link", { name: "Novidades" })).toHaveAttribute(
      "href",
      "/feed",
    );
  });

  it("shows the Cockpit nav link for staff", async () => {
    setup(CONSULTANT);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Cockpit" })).toHaveAttribute(
        "href",
        "/portfolio/cockpit",
      ),
    );
  });

  it("hides the Cockpit nav link for clients (role-aware)", async () => {
    setup(CLIENT);
    // Wait until the user has loaded so the role gate has settled.
    await waitFor(() => expect(screen.getByText("Bruno Cliente")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Cockpit" })).not.toBeInTheDocument();
  });

  it("shows the signed-in user's name and a theme toggle", async () => {
    setup(CONSULTANT);
    await waitFor(() => expect(screen.getByText("Ana Consultora")).toBeInTheDocument());
    expect(
      screen.getByRole("button", { name: /tema (claro|escuro)/i }),
    ).toBeInTheDocument();
  });
});
