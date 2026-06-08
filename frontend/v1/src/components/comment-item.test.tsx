import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentItem } from "./comment-item";
import type { Comment } from "@/lib/api/types";

function c(over: Partial<Comment> = {}): Comment {
  return {
    id: "c1",
    project_id: "p1",
    author_id: "u1",
    parent_id: null,
    body: "Comentário de teste",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("CommentItem", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders the body and shows (editado) when updated differs from created", () => {
    render(
      <CommentItem
        comment={c({ updated_at: "2026-06-02T00:00:00Z" })}
        canEdit={false}
        canDelete={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Comentário de teste")).toBeInTheDocument();
    expect(screen.getByText(/\(editado\)/)).toBeInTheDocument();
  });

  it("hides the action buttons without permission", () => {
    render(<CommentItem comment={c()} canEdit={false} canDelete={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("edits the comment", async () => {
    const onEdit = vi.fn();
    render(<CommentItem comment={c()} canEdit={true} canDelete={false} onEdit={onEdit} onDelete={() => {}} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const ta = screen.getByLabelText("Comentário");
    await user.clear(ta);
    await user.type(ta, "novo texto");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onEdit).toHaveBeenCalledWith("novo texto");
  });

  it("deletes through the alert dialog", async () => {
    const onDelete = vi.fn();
    render(<CommentItem comment={c()} canEdit={false} canDelete={true} onEdit={() => {}} onDelete={onDelete} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
