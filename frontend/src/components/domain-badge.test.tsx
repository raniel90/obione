import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DomainBadge } from "./domain-badge";

describe("DomainBadge", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders the PT-BR label for a domain", () => {
    render(<DomainBadge domain="legal" />);
    expect(screen.getByText("Jurídico")).toBeInTheDocument();
  });

  it("renders gastronomy label", () => {
    render(<DomainBadge domain="gastronomy" />);
    expect(screen.getByText("Gastronomia")).toBeInTheDocument();
  });
});
