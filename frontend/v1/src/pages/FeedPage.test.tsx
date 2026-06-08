import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
    created_at: "2026-06-04T10:00:00Z",
    summary: "Nova extração via mock",
    ...over,
  };
}

describe("FeedPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // shouldAdvanceTime lets React Query promises + waitFor progress while the
    // clock stays pinned (so "Hoje"/"Ontem" labels are deterministic).
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-04T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("renders the events grouped by day", async () => {
    vi.spyOn(feedApi, "getFeed").mockResolvedValue([
      ev({ target_id: "e1", project_name: "Freire Batista ADV", created_at: "2026-06-04T10:00:00Z" }),
      ev({ target_id: "c1", kind: "new_comment", project_name: "Valença Odontologia", summary: "Olá", created_at: "2026-06-03T10:00:00Z" }),
    ]);
    renderWithProviders(<FeedPage />);
    await waitFor(() => expect(screen.getByText("Novidades")).toBeInTheDocument());
    expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument();
    expect(screen.getByText("Valença Odontologia")).toBeInTheDocument();
    // Day-group headers (timeline).
    expect(screen.getByRole("heading", { name: "Hoje" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ontem" })).toBeInTheDocument();
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
