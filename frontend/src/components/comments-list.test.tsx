import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommentsList } from "./comments-list";
import type { CommentBrief } from "@/lib/api/types";

const COMMENTS: CommentBrief[] = [
  { id: "c1", author_id: "a1", parent_id: null, body: "Faltou o cronograma", created_at: "2026-06-01T12:00:00Z" },
];

describe("CommentsList", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders comment bodies", () => {
    render(<CommentsList comments={COMMENTS} />);
    expect(screen.getByText("Faltou o cronograma")).toBeInTheDocument();
  });

  it("renders an empty state when there are no comments", () => {
    render(<CommentsList comments={[]} />);
    expect(screen.getByText(/nenhum comentário/i)).toBeInTheDocument();
  });
});
