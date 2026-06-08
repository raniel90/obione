import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import * as draftsApi from "@/lib/api/drafts";
import { DraftsSection } from "./drafts-section";
import type { Draft } from "@/lib/api/types";

function d(over: Partial<Draft> = {}): Draft {
  return {
    id: "d1",
    project_id: "p1",
    source_extraction_id: "e1",
    kind: "next_step",
    title: "Definir KPIs",
    body: "Corpo",
    status: "draft",
    llm_model: "mock",
    generated_by: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("DraftsSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("groups drafts by kind", async () => {
    vi.spyOn(draftsApi, "listDrafts").mockResolvedValue([
      d({ id: "a", kind: "next_step", title: "Passo A" }),
      d({ id: "b", kind: "attention_point", title: "Atenção B" }),
    ]);
    renderWithProviders(<DraftsSection projectId="p1" canAuthor={true} />);
    await waitFor(() => expect(screen.getByText("Próximos Passos")).toBeInTheDocument());
    expect(screen.getByText("Pontos de Atenção")).toBeInTheDocument();
    expect(screen.getByText("Passo A")).toBeInTheDocument();
    expect(screen.getByText("Atenção B")).toBeInTheDocument();
  });

  it("generates drafts on the staff button", async () => {
    vi.spyOn(draftsApi, "listDrafts").mockResolvedValue([]);
    const gen = vi.spyOn(draftsApi, "generateDrafts").mockResolvedValue([d()]);
    renderWithProviders(<DraftsSection projectId="p1" canAuthor={true} />);
    await waitFor(() => expect(screen.getByText(/nenhum draft ainda/i)).toBeInTheDocument());
    await userEvent.setup().click(screen.getByRole("button", { name: /gerar com ia/i }));
    expect(gen).toHaveBeenCalledWith("p1");
  });

  it("hides the generate button and shows the client empty state for a non-author", async () => {
    vi.spyOn(draftsApi, "listDrafts").mockResolvedValue([]);
    renderWithProviders(<DraftsSection projectId="p1" canAuthor={false} />);
    await waitFor(() =>
      expect(screen.getByText(/nenhuma orientação publicada ainda/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /gerar com ia/i })).not.toBeInTheDocument();
  });

  it("shows an error state with retry", async () => {
    vi.spyOn(draftsApi, "listDrafts").mockRejectedValue(new Error("boom"));
    renderWithProviders(<DraftsSection projectId="p1" canAuthor={true} />);
    await waitFor(() => expect(screen.getByText(/erro ao carregar os drafts/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
