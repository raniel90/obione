import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "@/test/render";
import * as visibilityApi from "@/lib/api/visibility";
import { ProjectVisibilityPage } from "./ProjectVisibilityPage";
import type { VisibilityState } from "@/lib/api/types";

const STATE: VisibilityState = {
  categories: [{ category_key: "conteudo_geral", visible: true, updated_at: "2026-06-01T00:00:00Z" }],
  overrides: [{ attribute_key: "licitacao", visible: false, updated_at: "2026-06-01T00:00:00Z" }],
  resolved: { nome_projeto: true, descricao: true },
};

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:id/visibility" element={<ProjectVisibilityPage />} />
    </Routes>,
    { initialEntries: ["/projects/p1/visibility"] },
  );
}

describe("ProjectVisibilityPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the resolved summary and the 8 categories", async () => {
    vi.spyOn(visibilityApi, "getVisibilityState").mockResolvedValue(STATE);
    setup();
    await waitFor(() =>
      expect(screen.getByText(/Cliente vê 2 de 43 atributos/i)).toBeInTheDocument(),
    );
    expect(screen.getByText("Conteúdo geral")).toBeInTheDocument();
    expect(screen.getByText("Custos")).toBeInTheDocument();
    expect(screen.getByText("Lições aprendidas")).toBeInTheDocument();
  });

  it("toggling a category calls setCategoryVisibility with the inverse value", async () => {
    vi.spyOn(visibilityApi, "getVisibilityState").mockResolvedValue(STATE);
    const spy = vi.spyOn(visibilityApi, "setCategoryVisibility").mockResolvedValue(undefined);
    setup();
    await waitFor(() => expect(screen.getByText("Conteúdo geral")).toBeInTheDocument());
    await userEvent.setup().click(screen.getByRole("switch", { name: /Conteúdo geral/i }));
    expect(spy).toHaveBeenCalledWith("p1", "conteudo_geral", false);
  });

  it("changing an attribute to Oculto calls setAttributeOverride(false)", async () => {
    vi.spyOn(visibilityApi, "getVisibilityState").mockResolvedValue(STATE);
    const put = vi.spyOn(visibilityApi, "setAttributeOverride").mockResolvedValue(undefined);
    setup();
    await waitFor(() => expect(screen.getByText("Nome do projeto")).toBeInTheDocument());
    const ocultos = screen.getAllByRole("radio", { name: "Oculto" });
    await userEvent.setup().click(ocultos[0]);
    expect(put).toHaveBeenCalledWith("p1", "nome_projeto", false);
  });

  it("shows an error state with retry when the query fails", async () => {
    vi.spyOn(visibilityApi, "getVisibilityState").mockRejectedValue(new Error("boom"));
    setup();
    await waitFor(() =>
      expect(screen.getByText(/erro ao carregar a visibilidade/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
