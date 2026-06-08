import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithRouter } from "@/test/render";
import { AuthProvider } from "@/lib/auth-context";
import * as authApi from "@/lib/api/auth";
import { LoginPage } from "./LoginPage";

const USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "c@x.com",
  name: "Consultor",
  role: "consultant" as const,
  created_at: "2026-06-01T00:00:00Z",
};

function setup() {
  return renderWithRouter(
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div data-testid="home">home</div>} />
      </Routes>
    </AuthProvider>,
    { initialEntries: ["/login"] },
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders email and password fields", async () => {
    setup();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("rejects invalid email", async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "not-an-email");
    await user.type(screen.getByLabelText(/senha/i), "pwd12345678");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByText(/e-mail inválido/i)).toBeInTheDocument();
  });

  it("rejects short password", async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "c@x.com");
    await user.type(screen.getByLabelText(/senha/i), "short");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByText(/pelo menos 8/i)).toBeInTheDocument();
  });

  it("submits credentials and navigates to / on success", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      access_token: "t",
      token_type: "bearer",
      expires_in: 3600,
    });
    vi.spyOn(authApi, "me").mockResolvedValue(USER);

    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "c@x.com");
    await user.type(screen.getByLabelText(/senha/i), "pwd12345678");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => expect(screen.getByTestId("home")).toBeInTheDocument());
  });

  it("shows an error message when the backend rejects credentials", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new Error("bad creds"));
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "c@x.com");
    await user.type(screen.getByLabelText(/senha/i), "pwd12345678");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/credenciais inválidas|erro ao entrar/i)).toBeInTheDocument();
  });
});
