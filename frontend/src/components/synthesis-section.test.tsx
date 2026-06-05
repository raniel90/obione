import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import * as synthesisApi from "@/lib/api/synthesis";
import { SynthesisSection } from "./synthesis-section";
import type { Synthesis } from "@/lib/api/types";

function s(over: Partial<Synthesis> = {}): Synthesis {
  return {
    id: "s1",
    domain: "legal",
    title: "Síntese — Jurídico",
    body: "## Padrões recorrentes\n- Projeto 1: x",
    status: "draft",
    source_project_ids: ["p1", "p2"],
    llm_model: "mock-synthesis-v1",
    generated_by: "c1",
    reviewed_by: null,
    reviewed_at: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("SynthesisSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("staff (domain) renders the generate button and the synthesis list", async () => {
    vi.spyOn(synthesisApi, "listSyntheses").mockResolvedValue([s()]);
    const gen = vi.spyOn(synthesisApi, "generateSynthesis").mockResolvedValue(s({ id: "s2" }));
    renderWithProviders(<SynthesisSection domain="legal" canAuthor />);
    await waitFor(() => expect(screen.getByText("Síntese — Jurídico")).toBeInTheDocument());
    expect(screen.getByText("Padrões recorrentes")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /gerar com ia/i }));
    expect(gen).toHaveBeenCalled();
  });

  it("staff can publish a draft synthesis", async () => {
    vi.spyOn(synthesisApi, "listSyntheses").mockResolvedValue([s()]);
    const pub = vi.spyOn(synthesisApi, "publishSynthesis").mockResolvedValue(s({ status: "published" }));
    renderWithProviders(<SynthesisSection domain="legal" canAuthor />);
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getByText("Síntese — Jurídico")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /^publicar$/i }));
    await user.click(await screen.findByRole("button", { name: /^publicar$/i }));
    await waitFor(() => expect(pub).toHaveBeenCalledWith("s1"));
  });

  it("read mode (projectId, non-author) lists published and hides the generate button", async () => {
    vi.spyOn(synthesisApi, "listProjectSyntheses").mockResolvedValue([
      s({ status: "published" }),
    ]);
    renderWithProviders(<SynthesisSection projectId="p1" canAuthor={false} />);
    await waitFor(() => expect(screen.getByText("Síntese — Jurídico")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /gerar com ia/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });

  it("shows the client empty state for a non-author with no published syntheses", async () => {
    vi.spyOn(synthesisApi, "listProjectSyntheses").mockResolvedValue([]);
    renderWithProviders(<SynthesisSection projectId="p1" canAuthor={false} />);
    await waitFor(() =>
      expect(screen.getByText(/nenhuma síntese publicada para este domínio/i)).toBeInTheDocument(),
    );
  });
});
