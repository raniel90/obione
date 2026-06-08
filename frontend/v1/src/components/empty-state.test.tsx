import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the message and optional description", () => {
    render(
      <EmptyState icon={Inbox} message="Nada aqui ainda." description="Volte mais tarde." />,
    );
    expect(screen.getByText("Nada aqui ainda.")).toBeInTheDocument();
    expect(screen.getByText("Volte mais tarde.")).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    render(
      <EmptyState icon={Inbox} message="Vazio" action={<button>Recarregar</button>} />,
    );
    expect(screen.getByRole("button", { name: "Recarregar" })).toBeInTheDocument();
  });
});
