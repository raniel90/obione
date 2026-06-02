import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSuggestionCard } from "./theme-suggestion-card";
import type { ThemeSuggestion } from "@/lib/api/types";

function sugg(over: Partial<ThemeSuggestion> = {}): ThemeSuggestion {
  return {
    id: "s1",
    project_id: "p1",
    suggested_domain: "legal",
    confidence: 0.92,
    model_id: "mock",
    reasoning: "Documentos de natureza jurídica.",
    accepted: false,
    accepted_by: null,
    accepted_at: null,
    created_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("ThemeSuggestionCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders domain label, confidence and reasoning", () => {
    render(<ThemeSuggestionCard suggestion={sugg()} />);
    expect(screen.getByText("Jurídico")).toBeInTheDocument();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
    expect(screen.getByText(/Documentos de natureza/)).toBeInTheDocument();
  });

  it("shows the Accept button when onAccept is given and not accepted", () => {
    render(<ThemeSuggestionCard suggestion={sugg()} onAccept={() => {}} />);
    expect(screen.getByRole("button", { name: /^aceitar$/i })).toBeInTheDocument();
  });

  it("calls onAccept when the button is clicked", async () => {
    const onAccept = vi.fn();
    render(<ThemeSuggestionCard suggestion={sugg()} onAccept={onAccept} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /^aceitar$/i }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("hides Accept and shows accepted state when accepted", () => {
    render(
      <ThemeSuggestionCard
        suggestion={sugg({ accepted: true, accepted_at: "2026-06-01T00:00:00Z" })}
        onAccept={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /^aceitar$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/aceita em 01\/06\/2026/i)).toBeInTheDocument();
  });

  it("does not show Accept without onAccept (history row)", () => {
    render(<ThemeSuggestionCard suggestion={sugg()} />);
    expect(screen.queryByRole("button", { name: /^aceitar$/i })).not.toBeInTheDocument();
  });
});
