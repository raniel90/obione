import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import * as usersApi from "@/lib/api/users";
import * as projectsApi from "@/lib/api/projects";
import { LinkClientDialog } from "./link-client-dialog";
import type { User } from "@/lib/api/types";

const CLIENTS: User[] = [
  { id: "u1", email: "cliente1@obione.dev", name: "Cliente Um", role: "client", created_at: "2026-06-01T00:00:00Z" },
  { id: "u2", email: "cliente2@obione.dev", name: "Cliente Dois", role: "client", created_at: "2026-06-01T00:00:00Z" },
];

describe("LinkClientDialog", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("opens, lists clients, and links the chosen one", async () => {
    vi.spyOn(usersApi, "listClients").mockResolvedValue(CLIENTS);
    const addSpy = vi.spyOn(projectsApi, "addProjectClient").mockResolvedValue(undefined);
    renderWithProviders(<LinkClientDialog projectId="p1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /vincular cliente/i }));
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Cliente Dois/ }));
    await user.click(screen.getByRole("button", { name: /^vincular$/i }));

    await waitFor(() => expect(addSpy).toHaveBeenCalledWith("p1", "u2"));
  });

  it("disables the confirm button until a client is chosen", async () => {
    vi.spyOn(usersApi, "listClients").mockResolvedValue(CLIENTS);
    renderWithProviders(<LinkClientDialog projectId="p1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /vincular cliente/i }));
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^vincular$/i })).toBeDisabled();
  });
});
