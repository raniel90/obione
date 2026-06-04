import { api } from "./client";
import type { Cockpit, CoverageMatrix } from "./types";

export function getCockpit(): Promise<Cockpit> {
  return api<Cockpit>("/portfolio/cockpit");
}

export function getCoverageMatrix(): Promise<CoverageMatrix> {
  return api<CoverageMatrix>("/portfolio/coverage-matrix");
}
