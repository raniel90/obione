import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VisibilityCategoryRow } from "./visibility-category-row";
import { CATEGORIES } from "@/lib/mpo/catalog";

const CAT = CATEGORIES[0]; // "conteudo_geral" — "Conteúdo geral"

describe("VisibilityCategoryRow", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders the category label and the visible count", () => {
    render(
      <VisibilityCategoryRow
        category={CAT}
        categoryVisible={false}
        choiceByAttr={{}}
        resolved={{}}
        onToggleCategory={() => {}}
        onChangeAttr={() => {}}
      />,
    );
    expect(screen.getByText("Conteúdo geral")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`0/${CAT.attributes.length} vis`))).toBeInTheDocument();
  });

  it("toggles the category on switch click", async () => {
    const onToggle = vi.fn();
    render(
      <VisibilityCategoryRow
        category={CAT}
        categoryVisible={false}
        choiceByAttr={{}}
        resolved={{}}
        onToggleCategory={onToggle}
        onChangeAttr={() => {}}
      />,
    );
    await userEvent.setup().click(screen.getByRole("switch", { name: /Conteúdo geral/i }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("counts resolved-visible attributes", () => {
    const resolved: Record<string, boolean> = {};
    resolved[CAT.attributes[0].key] = true;
    resolved[CAT.attributes[1].key] = true;
    render(
      <VisibilityCategoryRow
        category={CAT}
        categoryVisible={true}
        choiceByAttr={{}}
        resolved={resolved}
        onToggleCategory={() => {}}
        onChangeAttr={() => {}}
      />,
    );
    expect(screen.getByText(new RegExp(`2/${CAT.attributes.length} vis`))).toBeInTheDocument();
  });
});
