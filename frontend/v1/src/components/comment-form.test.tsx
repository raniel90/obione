import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentForm } from "./comment-form";

describe("CommentForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("submits the typed body", async () => {
    const onSubmit = vi.fn();
    render(<CommentForm onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Comentário"), "Olá mundo");
    await user.click(screen.getByRole("button", { name: "Comentar" }));
    expect(onSubmit).toHaveBeenCalledWith("Olá mundo");
  });

  it("rejects an empty body", async () => {
    const onSubmit = vi.fn();
    render(<CommentForm onSubmit={onSubmit} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Comentar" }));
    expect(await screen.findByText(/não pode ser vazio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders edit mode with the default value and a cancel button", async () => {
    const onCancel = vi.fn();
    render(
      <CommentForm onSubmit={() => {}} defaultValue="texto antigo" submitLabel="Salvar" onCancel={onCancel} />,
    );
    expect(screen.getByLabelText("Comentário")).toHaveValue("texto antigo");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
