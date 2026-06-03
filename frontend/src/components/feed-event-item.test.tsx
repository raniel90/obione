import { describe, it, expect } from "vitest";
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
  it("renders the project name, summary and timestamp inside a link to the project", () => {
    renderWithRouter(<FeedEventItem event={ev()} />);
    expect(screen.getByText("Freire Batista ADV")).toBeInTheDocument();
    expect(screen.getByText("Comentário de teste")).toBeInTheDocument();
    expect(screen.getByText("01/06/2026 09:30")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/projects/p1");
  });
});
