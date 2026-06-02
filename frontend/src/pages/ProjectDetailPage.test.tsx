import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "@/test/render";
import { RequireAuth } from "@/components/require-auth";
import * as authApi from "@/lib/api/auth";
import * as projectsApi from "@/lib/api/projects";
import * as extractionsApi from "@/lib/api/extractions";
import * as themesApi from "@/lib/api/themes";
import { TOKEN_STORAGE_KEY } from "@/lib/api/token";
import { ApiError } from "@/lib/api/error";
import { ProjectDetailPage } from "./ProjectDetailPage";
import type { ProjectDetail, ExtractionRun, User } from "@/lib/api/types";

const CONSULTANT: User = { id: "c1", email: "c@x.com", name: "C", role: "consultant", created_at: "2026-06-01T00:00:00Z" };
const CLIENT: User = { id: "cli1", email: "cli@x.com", name: "Cli", role: "client", created_at: "2026-06-01T00:00:00Z" };

const PROJECT = { id: "p1", name: "Freire Batista ADV", domain: "legal", description: "d", consultant_id: "c1", created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" } as const;

function detail(over: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    project: { ...PROJECT },
    latest_llm_extraction: { id: "e1", source: "llm", llm_model: "m", created_at: "2026-06-01T00:00:00Z" },
    latest_gabarito: null,
    coverage: { extraction_id: "e1", filled: 1, total_in_scope: 44, out_of_scope_count: 1, percentage: 2 },
    evaluation: null,
    recent_comments: [],
    counts: { extractions: 1, comments: 0 },
    ...over,
  };
}

function run(content: Record<string, unknown>): ExtractionRun {
  return { id: "e1", project_id: "p1", source: "llm", llm_model: "m", source_description_hash: null, content, created_at: "2026-06-01T00:00:00Z" };
}

const META = { origem: "llm", projeto_nome: "X", documento_fonte: "x.docx", data_extracao: "2026-06-01T00:00:00Z" };

function setup(user: User) {
  localStorage.setItem(TOKEN_STORAGE_KEY, "good");
  vi.spyOn(authApi, "me").mockResolvedValue(user);
  vi.spyOn(themesApi, "listThemeSuggestions").mockResolvedValue([]);
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:id"
        element={
          <RequireAuth>
            <ProjectDetailPage />
          </RequireAuth>
        }
      />
    </Routes>,
    { initialEntries: ["/projects/p1"] },
  );
}

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the project name and attributes for a consultant", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail());
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([
      run({ _meta: META, nome_projeto: "Projeto X", custo_estimado: 1000 }),
    ]);
    setup(CONSULTANT);
    await waitFor(() => expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument());
    expect(screen.getByText("Projeto X")).toBeInTheDocument();
  });

  it("shows the coverage bar for a consultant", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail({ coverage: { extraction_id: "e1", filled: 32, total_in_scope: 44, out_of_scope_count: 1, percentage: 73 } }));
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([run({ _meta: META, nome_projeto: "Projeto X" })]);
    setup(CONSULTANT);
    await waitFor(() => expect(screen.getByText(/73%/)).toBeInTheDocument());
  });

  it("hides coverage and evaluation for a client", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(
      detail({ evaluation: { tp: 1, fp: 0, fn: 0, tn: 0, precision: 1, recall: 1, f1: 1, needs_human_review_count: 0 } }),
    );
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([run({ _meta: META, nome_projeto: "Projeto X" })]);
    setup(CLIENT);
    await waitFor(() => expect(screen.getByText("Projeto X")).toBeInTheDocument());
    expect(screen.queryByText(/Cobertura/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Precision/)).not.toBeInTheDocument();
  });

  it("renders a not-found message on 404", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockRejectedValue(new ApiError(404, "not_found", "x"));
    vi.spyOn(extractionsApi, "listExtractions").mockRejectedValue(new ApiError(404, "not_found", "x"));
    setup(CONSULTANT);
    await waitFor(() => expect(screen.getByText(/não encontrado/i)).toBeInTheDocument());
  });

  it("shows an empty state when the project has no llm extraction", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail({ latest_llm_extraction: null, coverage: { extraction_id: null, filled: 0, total_in_scope: 44, out_of_scope_count: 1, percentage: 0 } }));
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([]);
    setup(CONSULTANT);
    await waitFor(() => expect(screen.getByText(/extração ainda não executada/i)).toBeInTheDocument());
  });

  it("shows an attributes error (not the empty state) when extractions fail but detail succeeds", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail());
    vi.spyOn(extractionsApi, "listExtractions").mockRejectedValue(new ApiError(500, "server_error", "x"));
    setup(CONSULTANT);
    await waitFor(() => expect(screen.getByText(/erro ao carregar atributos/i)).toBeInTheDocument());
    expect(screen.queryByText(/extração ainda não executada/i)).not.toBeInTheDocument();
  });

  it("shows the theme section for a consultant", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail());
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([run({ _meta: META, nome_projeto: "Projeto X" })]);
    setup(CONSULTANT);
    await waitFor(() =>
      expect(screen.getByText(/temática \(classificação ia\)/i)).toBeInTheDocument(),
    );
  });

  it("hides the theme section for a client", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail());
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([run({ _meta: META, nome_projeto: "Projeto X" })]);
    setup(CLIENT);
    await waitFor(() => expect(screen.getByText("Projeto X")).toBeInTheDocument());
    expect(screen.queryByText(/temática \(classificação ia\)/i)).not.toBeInTheDocument();
  });

  it("shows the visibility config link for a consultant", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail());
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([run({ _meta: META, nome_projeto: "Projeto X" })]);
    setup(CONSULTANT);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /configurar visibilidade/i })).toBeInTheDocument(),
    );
  });

  it("hides the visibility config link for a client", async () => {
    vi.spyOn(projectsApi, "getProjectDetail").mockResolvedValue(detail());
    vi.spyOn(extractionsApi, "listExtractions").mockResolvedValue([run({ _meta: META, nome_projeto: "Projeto X" })]);
    setup(CLIENT);
    await waitFor(() => expect(screen.getByText("Projeto X")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: /configurar visibilidade/i })).not.toBeInTheDocument();
  });
});
