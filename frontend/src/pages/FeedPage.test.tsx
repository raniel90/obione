import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import * as feedApi from "@/lib/api/feed";
import { FeedPage } from "./FeedPage";
import type { FeedEvent } from "@/lib/api/types";

function ev(over: Partial<FeedEvent> = {}): FeedEvent {
  return {
    kind: "new_extraction",
    project_id: "p1",
    project_name: "Freire Batista ADV",
    actor_id: null,
    target_id: "e1",
    created_at: "2026-06-01T00:00:00Z",
    summary: "Nova extração via mock",
    ...over,
  };
}

describe("FeedPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the feed events", async () => {
    vi.spyOn(feedApi, "getFeed").mockResolvedValue([
      ev({ target_id: "e1", project_name: "Freire Batista ADV" }),
      ev({ target_id: "c1", kind: "new_comment", project_name: "Valença Odontologia", summary: "Olá" }),
    ]);
    renderWithProviders(<FeedPage />);
    await waitFor(() => expect(screen.getByText("Novidades")).toBeInTheDocument());
    expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument();
    expect(screen.getByText("Valença Odontologia")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.spyOn(feedApi, "getFeed").mockResolvedValue([]);
    renderWithProviders(<FeedPage />);
    await waitFor(() => expect(screen.getByText(/nenhuma novidade ainda/i)).toBeInTheDocument());
  });

  it("shows an error state with retry", async () => {
    vi.spyOn(feedApi, "getFeed").mockRejectedValue(new Error("boom"));
    renderWithProviders(<FeedPage />);
    await waitFor(() => expect(screen.getByText(/erro ao carregar as novidades/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
