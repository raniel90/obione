import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "@/test/render";
import { FeedEventItem } from "./feed-event-item";
import type { FeedEvent } from "@/lib/api/types";

function ev(over: Partial<FeedEvent> = {}): FeedEvent {
  return {
    kind: "new_comment",
    project_id: "p1",
    project_name: "Freire Batista ADV",
    actor_id: "u1",
    target_id: "c1",
    created_at: "2026-06-01T09:30:00Z",
    summary: "Comentário de teste",
    ...over,
  };
}

describe("FeedEventItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T09:30:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("renders the project name, summary and a relative time, inside a project link", () => {
    renderWithRouter(<FeedEventItem event={ev()} />);
    expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument();
    expect(screen.getByText("Comentário de teste")).toBeInTheDocument();
    // 2026-06-01 09:30 vs fixed now 2026-06-04 09:30 → "há 3 dias".
    expect(screen.getByText(/há 3 dias/i)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/projects/p1");
  });

  it("keeps the absolute timestamp as a tooltip", () => {
    renderWithRouter(<FeedEventItem event={ev()} />);
    expect(screen.getByText(/há 3 dias/i)).toHaveAttribute("title", "01/06/2026 09:30");
  });
});
