import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttributeRow } from "./attribute-row";
import type { GroupedAttribute } from "@/lib/mpo/group-attributes";

function row(partial: Partial<GroupedAttribute> & Pick<GroupedAttribute, "renderType" | "value">): GroupedAttribute {
  return { key: "k", label: "Rótulo", ...partial } as GroupedAttribute;
}

describe("AttributeRow", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders text value", () => {
    render(<AttributeRow attr={row({ renderType: "text", value: "Olá mundo" })} />);
    expect(screen.getByText("Olá mundo")).toBeInTheDocument();
  });

  it("renders a date as dd/MM/yyyy", () => {
    render(<AttributeRow attr={row({ renderType: "date", value: "2026-06-01" })} />);
    expect(screen.getByText("01/06/2026")).toBeInTheDocument();
  });

  it("renders currency in BRL", () => {
    render(<AttributeRow attr={row({ renderType: "currency", value: 1250.5 })} />);
    expect(screen.getByText(/R\$/)).toBeInTheDocument();
    expect(screen.getByText(/1\.250,50/)).toBeInTheDocument();
  });

  it("renders an array as chips", () => {
    render(<AttributeRow attr={row({ renderType: "array", value: ["Ana", "Bia"] })} />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bia")).toBeInTheDocument();
  });

  it("renders enum_porte via label map", () => {
    render(<AttributeRow attr={row({ renderType: "enum_porte", value: "medio" })} />);
    expect(screen.getByText("Médio")).toBeInTheDocument();
  });

  it("renders enum_status via label map", () => {
    render(<AttributeRow attr={row({ renderType: "enum_status", value: "no_prazo" })} />);
    expect(screen.getByText("No prazo")).toBeInTheDocument();
  });

  it("renders null as an em dash", () => {
    render(<AttributeRow attr={row({ renderType: "text", value: null })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders out_of_scope with a muted marker, not an em dash", () => {
    render(<AttributeRow attr={row({ renderType: "out_of_scope", value: null })} />);
    expect(screen.getByText("(fora de escopo)")).toBeInTheDocument();
  });
});
