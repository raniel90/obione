import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "@/test/render";
import * as projectsApi from "@/lib/api/projects";
import { ProjectCreatePage } from "./ProjectCreatePage";
import type { Project } from "@/lib/api/types";

const CREATED: Project = {
  id: "p9",
  name: "Projeto Novo",
  domain: "legal",
  description: "x".repeat(200),
  consultant_id: "c1",
  created_at: "2026-06-03T00:00:00Z",
  updated_at: "2026-06-03T00:00:00Z",
};

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/new" element={<ProjectCreatePage />} />
      <Route path="/projects/:id" element={<div data-testid="detail">detail</div>} />
    </Routes>,
    { initialEntries: ["/projects/new"] },
  );
}

describe("ProjectCreatePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the form fields", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Novo projeto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
  });

  it("blocks submit and shows validation errors when fields are invalid", async () => {
    const spy = vi.spyOn(projectsApi, "createProject");
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/descrição/i), "curto demais");
    await user.click(screen.getByRole("button", { name: /criar projeto/i }));
    expect(await screen.findByText(/informe um nome/i)).toBeInTheDocument();
    expect(screen.getByText(/pelo menos 200 caracteres/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it("creates the project and navigates to its detail on valid submit", async () => {
    const spy = vi.spyOn(projectsApi, "createProject").mockResolvedValue(CREATED);
    setup();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Nome"), "Projeto Novo");
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Jurídico" }));
    await user.type(screen.getByLabelText(/descrição/i), "x".repeat(200));
    await user.click(screen.getByRole("button", { name: /criar projeto/i }));

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({
        name: "Projeto Novo",
        domain: "legal",
        description: "x".repeat(200),
      }),
    );
    await waitFor(() => expect(screen.getByTestId("detail")).toBeInTheDocument());
  });
});
