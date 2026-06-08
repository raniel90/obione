import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VisibilityAttributeRow } from "./visibility-attribute-row";
import type { AttributeDef } from "@/lib/mpo/catalog";

const ATTR: AttributeDef = { key: "licitacao", label: "Licitação", renderType: "text" };

describe("VisibilityAttributeRow", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders the label and the resolved badge", () => {
    render(<VisibilityAttributeRow attr={ATTR} choice="visible" resolved={true} onChange={() => {}} />);
    expect(screen.getByText("Licitação")).toBeInTheDocument();
    expect(screen.getByText("visível")).toBeInTheDocument();
  });

  it("marks the active choice as checked", () => {
    render(<VisibilityAttributeRow attr={ATTR} choice="visible" resolved={true} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Liberado" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Oculto" })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with the picked choice", async () => {
    const onChange = vi.fn();
    render(<VisibilityAttributeRow attr={ATTR} choice="inherit" resolved={false} onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("radio", { name: "Oculto" }));
    expect(onChange).toHaveBeenCalledWith("hidden");
  });

  it("shows 'oculto' when not resolved and marks out-of-scope", () => {
    render(
      <VisibilityAttributeRow
        attr={{ ...ATTR, outOfScope: true }}
        choice="inherit"
        resolved={false}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("oculto")).toBeInTheDocument();
    expect(screen.getByText(/fora de escopo/i)).toBeInTheDocument();
  });
});
