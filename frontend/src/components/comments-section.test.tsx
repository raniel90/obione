import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import * as commentsApi from "@/lib/api/comments";
import { CommentsSection } from "./comments-section";
import type { Comment } from "@/lib/api/types";

function c(over: Partial<Comment> = {}): Comment {
  return {
    id: "c1",
    project_id: "p1",
    author_id: "u1",
    parent_id: null,
    body: "Primeiro comentário",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("CommentsSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("lists comments and shows the new-comment form", async () => {
    vi.spyOn(commentsApi, "listComments").mockResolvedValue([c()]);
    renderWithProviders(<CommentsSection projectId="p1" currentUserId="u1" isStaff={false} />);
    await waitFor(() => expect(screen.getByText("Primeiro comentário")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Comentar" })).toBeInTheDocument();
  });

  it("shows an empty state when there are no comments", async () => {
    vi.spyOn(commentsApi, "listComments").mockResolvedValue([]);
    renderWithProviders(<CommentsSection projectId="p1" currentUserId="u1" isStaff={false} />);
    await waitFor(() => expect(screen.getByText(/nenhum comentário ainda/i)).toBeInTheDocument());
  });

  it("posts a new comment", async () => {
    vi.spyOn(commentsApi, "listComments").mockResolvedValue([]);
    const create = vi.spyOn(commentsApi, "createComment").mockResolvedValue(c());
    renderWithProviders(<CommentsSection projectId="p1" currentUserId="u1" isStaff={false} />);
    await waitFor(() => expect(screen.getByText(/nenhum comentário ainda/i)).toBeInTheDocument());
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Comentário"), "Olá");
    await user.click(screen.getByRole("button", { name: "Comentar" }));
    expect(create).toHaveBeenCalledWith("p1", "Olá");
  });

  it("shows edit/delete only on the user's own comment (delete also for staff)", async () => {
    vi.spyOn(commentsApi, "listComments").mockResolvedValue([
      c({ id: "mine", author_id: "u1", body: "meu" }),
      c({ id: "theirs", author_id: "u2", body: "deles" }),
    ]);
    renderWithProviders(<CommentsSection projectId="p1" currentUserId="u1" isStaff={false} />);
    await waitFor(() => expect(screen.getByText("meu")).toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Excluir" })).toHaveLength(1);
  });

  it("shows an error state with retry", async () => {
    vi.spyOn(commentsApi, "listComments").mockRejectedValue(new Error("boom"));
    renderWithProviders(<CommentsSection projectId="p1" currentUserId="u1" isStaff={false} />);
    await waitFor(() => expect(screen.getByText(/erro ao carregar comentários/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
