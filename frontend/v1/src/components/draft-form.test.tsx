import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DraftForm } from "./draft-form";

describe("DraftForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("submits title and body", async () => {
    const onSubmit = vi.fn();
    render(<DraftForm defaultBody="" onSubmit={onSubmit} onCancel={() => {}} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Título"), "Meu título");
    await user.type(screen.getByLabelText("Corpo do draft"), "Meu corpo");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).toHaveBeenCalledWith({ title: "Meu título", body: "Meu corpo" });
  });

  it("rejects an empty body", async () => {
    const onSubmit = vi.fn();
    render(<DraftForm defaultBody="" onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText(/corpo não pode ser vazio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("prefills from defaults and cancels", async () => {
    const onCancel = vi.fn();
    render(
      <DraftForm defaultTitle="T" defaultBody="B" onSubmit={() => {}} onCancel={onCancel} />,
    );
    expect(screen.getByLabelText("Título")).toHaveValue("T");
    expect(screen.getByLabelText("Corpo do draft")).toHaveValue("B");
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
