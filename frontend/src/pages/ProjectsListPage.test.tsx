import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "@/test/render";
import * as projectsApi from "@/lib/api/projects";
import { ProjectsListPage } from "./ProjectsListPage";
import type { Project } from "@/lib/api/types";

const PROJECTS: Project[] = [
  { id: "p1", name: "Freire Batista ADV", domain: "legal", description: "d", consultant_id: "c1", created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" },
  { id: "p2", name: "Valença Odontologia", domain: "health", description: "d", consultant_id: "c1", created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" },
];

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects" element={<ProjectsListPage />} />
      <Route path="/projects/:id" element={<div data-testid="detail">detail</div>} />
    </Routes>,
    { initialEntries: ["/projects"] },
  );
}

describe("ProjectsListPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders a row per project", async () => {
    vi.spyOn(projectsApi, "listProjects").mockResolvedValue(PROJECTS);
    setup();
    await waitFor(() => expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument());
    expect(screen.getByText("Valença Odontologia")).toBeInTheDocument();
  });

  it("filters by search text", async () => {
    vi.spyOn(projectsApi, "listProjects").mockResolvedValue(PROJECTS);
    setup();
    await waitFor(() => expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument());
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/buscar/i), "valen");
    expect(screen.queryByText("Freire Batista ADV")).not.toBeInTheDocument();
    expect(screen.getByText("Valença Odontologia")).toBeInTheDocument();
  });

  it("navigates to the detail route on row click", async () => {
    vi.spyOn(projectsApi, "listProjects").mockResolvedValue(PROJECTS);
    setup();
    await waitFor(() => expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument());
    const user = userEvent.setup();
    await user.click(screen.getByText("Freire Batista ADV"));
    await waitFor(() => expect(screen.getByTestId("detail")).toBeInTheDocument());
  });

  it("shows an empty state when there are no projects", async () => {
    vi.spyOn(projectsApi, "listProjects").mockResolvedValue([]);
    setup();
    await waitFor(() => expect(screen.getByText(/nenhum projeto/i)).toBeInTheDocument());
  });

  it("pre-filters by the ?domain= query param", async () => {
    vi.spyOn(projectsApi, "listProjects").mockResolvedValue(PROJECTS);
    renderWithProviders(
      <Routes>
        <Route path="/projects" element={<ProjectsListPage />} />
      </Routes>,
      { initialEntries: ["/projects?domain=legal"] },
    );
    await waitFor(() => expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument());
    expect(screen.queryByText("Valença Odontologia")).not.toBeInTheDocument();
  });
});
