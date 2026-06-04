import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import * as projectsApi from "@/lib/api/projects";
import { EditProjectDialog } from "./edit-project-dialog";
import type { Project } from "@/lib/api/types";

const PROJECT: Project = {
  id: "p1",
  name: "Freire Batista ADV",
  domain: "legal",
  description: "x".repeat(220),
  consultant_id: "c1",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

describe("EditProjectDialog", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("prefills the form and PATCHes the project on save", async () => {
    const spy = vi
      .spyOn(projectsApi, "updateProject")
      .mockResolvedValue({ ...PROJECT, name: "Freire Batista Advocacia" });
    renderWithProviders(<EditProjectDialog project={PROJECT} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /editar/i }));
    const nameInput = await screen.findByLabelText("Nome");
    expect(nameInput).toHaveValue("Freire Batista ADV");

    await user.clear(nameInput);
    await user.type(nameInput, "Freire Batista Advocacia");
    await user.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith("p1", expect.objectContaining({ name: "Freire Batista Advocacia" })),
    );
  });
});
