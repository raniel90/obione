import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvaluationPanel } from "./evaluation-panel";
import type { Evaluation } from "@/lib/api/types";

const EVAL: Evaluation = {
  tp: 30, fp: 5, fn: 8, tn: 1,
  precision: 0.857, recall: 0.789, f1: 0.822,
  needs_human_review_count: 12,
};

describe("EvaluationPanel", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders precision, recall and F1", () => {
    render(<EvaluationPanel evaluation={EVAL} />);
    expect(screen.getByText("86%")).toBeInTheDocument();
    expect(screen.getByText("79%")).toBeInTheDocument();
    expect(screen.getByText("0.82")).toBeInTheDocument();
  });

  it("renders the human-review count", () => {
    render(<EvaluationPanel evaluation={EVAL} />);
    expect(screen.getByText(/12 atributos/)).toBeInTheDocument();
  });
});
