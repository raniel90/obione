import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import * as themesApi from "@/lib/api/themes";
import { ThemeSection } from "./theme-section";
import type { ThemeSuggestion } from "@/lib/api/types";

function sugg(over: Partial<ThemeSuggestion> = {}): ThemeSuggestion {
  return {
    id: "s1",
    project_id: "p1",
    suggested_domain: "legal",
    confidence: 0.92,
    model_id: "mock",
    reasoning: "R",
    accepted: false,
    accepted_by: null,
    accepted_at: null,
    created_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("ThemeSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the generate button and empty state when there are no suggestions", async () => {
    vi.spyOn(themesApi, "listThemeSuggestions").mockResolvedValue([]);
    renderWithProviders(<ThemeSection projectId="p1" currentDomain="legal" />);
    expect(screen.getByRole("button", { name: /sugerir temática/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/nenhuma sugestão ainda/i)).toBeInTheDocument());
  });

  it("renders the current suggestion with an Accept button", async () => {
    vi.spyOn(themesApi, "listThemeSuggestions").mockResolvedValue([sugg()]);
    renderWithProviders(<ThemeSection projectId="p1" currentDomain="health" />);
    await waitFor(() => expect(screen.getByText(/confiança 92%/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^aceitar$/i })).toBeInTheDocument();
  });

  it("generates a suggestion and shows it after refetch", async () => {
    const list = vi
      .spyOn(themesApi, "listThemeSuggestions")
      .mockResolvedValueOnce([])
      .mockResolvedValue([sugg()]);
    vi.spyOn(themesApi, "suggestTheme").mockResolvedValue(sugg());

    const user = userEvent.setup();
    renderWithProviders(<ThemeSection projectId="p1" currentDomain="legal" />);
    await waitFor(() => expect(screen.getByText(/nenhuma sugestão ainda/i)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /sugerir temática/i }));

    expect(themesApi.suggestTheme).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(screen.getByText(/confiança 92%/i)).toBeInTheDocument());
    expect(list.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("accepts the current suggestion", async () => {
    vi.spyOn(themesApi, "listThemeSuggestions").mockResolvedValue([sugg()]);
    vi.spyOn(themesApi, "acceptThemeSuggestion").mockResolvedValue(
      sugg({ accepted: true, accepted_at: "2026-06-01T00:00:00Z" }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ThemeSection projectId="p1" currentDomain="legal" />);
    await waitFor(() => expect(screen.getByRole("button", { name: /^aceitar$/i })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /^aceitar$/i }));
    expect(themesApi.acceptThemeSuggestion).toHaveBeenCalledWith("s1");
  });

  it("renders a history section when there are older suggestions", async () => {
    vi.spyOn(themesApi, "listThemeSuggestions").mockResolvedValue([
      sugg({ id: "s2", suggested_domain: "health", created_at: "2026-06-02T00:00:00Z" }),
      sugg({ id: "s1", suggested_domain: "legal", accepted: true, accepted_at: "2026-06-01T00:00:00Z" }),
    ]);
    renderWithProviders(<ThemeSection projectId="p1" currentDomain="sports" />);
    await waitFor(() => expect(screen.getByText(/histórico/i)).toBeInTheDocument());
    expect(screen.getByText("Saúde")).toBeInTheDocument();
    expect(screen.getByText("Jurídico")).toBeInTheDocument();
  });
});
