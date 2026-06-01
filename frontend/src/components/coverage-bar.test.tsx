import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoverageBar } from "./coverage-bar";

describe("CoverageBar", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders rounded percentage and filled/total", () => {
    render(<CoverageBar percentage={72.7} filled={32} total={44} />);
    expect(screen.getByText(/73%/)).toBeInTheDocument();
    expect(screen.getByText(/32\/44/)).toBeInTheDocument();
  });
});
