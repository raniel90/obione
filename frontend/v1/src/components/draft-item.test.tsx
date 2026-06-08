import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DraftItem } from "./draft-item";
import type { Draft } from "@/lib/api/types";

function d(over: Partial<Draft> = {}): Draft {
  return {
    id: "d1",
    project_id: "p1",
    source_extraction_id: "e1",
    kind: "next_step",
    title: "Definir KPIs",
    body: "Propor 2-3 indicadores.",
    status: "draft",
    llm_model: "mock-drafts-v1",
    generated_by: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("DraftItem", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders title, body and the status badge", () => {
    render(<DraftItem draft={d()} canAuthor={true} onEdit={() => {}} onPublish={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Definir KPIs")).toBeInTheDocument();
    expect(screen.getByText("Propor 2-3 indicadores.")).toBeInTheDocument();
    expect(screen.getByText("rascunho")).toBeInTheDocument();
  });

  it("shows the author actions for a staff draft", () => {
    render(<DraftItem draft={d()} canAuthor={true} onEdit={() => {}} onPublish={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descartar" })).toBeInTheDocument();
  });

  it("hides actions when published (read-only)", () => {
    render(<DraftItem draft={d({ status: "published" })} canAuthor={true} onEdit={() => {}} onPublish={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("publicado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publicar" })).not.toBeInTheDocument();
  });

  it("hides actions for a non-author (client)", () => {
    render(<DraftItem draft={d()} canAuthor={false} onEdit={() => {}} onPublish={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descartar" })).not.toBeInTheDocument();
  });

  it("publishes through the alert dialog", async () => {
    const onPublish = vi.fn();
    render(<DraftItem draft={d()} canAuthor={true} onEdit={() => {}} onPublish={onPublish} onDelete={() => {}} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Publicar" }));
    expect(onPublish).toHaveBeenCalledOnce();
  });

  it("edits the draft", async () => {
    const onEdit = vi.fn();
    render(<DraftItem draft={d()} canAuthor={true} onEdit={onEdit} onPublish={() => {}} onDelete={() => {}} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const ta = screen.getByLabelText("Corpo do draft");
    await user.clear(ta);
    await user.type(ta, "corpo novo");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onEdit).toHaveBeenCalledWith({ title: "Definir KPIs", body: "corpo novo" });
  });
});
