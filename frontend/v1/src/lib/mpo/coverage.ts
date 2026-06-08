import { CATEGORIES } from "./catalog";
import type { ExtractionContent } from "@/lib/api/types";

export interface CategoryCoverage {
  filled: number;
  total: number;
  percentage: number;
}

/**
 * Per-category fill ratio computed from the extraction content.
 * Mirrors the backend rule (a value counts as "filled" when it is non-null);
 * out-of-scope attributes are excluded from the denominator.
 * Only meaningful for consultant/admin, who receive every in-scope key.
 */
export function categoryCoverage(content: ExtractionContent): Record<string, CategoryCoverage> {
  const out: Record<string, CategoryCoverage> = {};
  for (const cat of CATEGORIES) {
    const inScope = cat.attributes.filter((a) => !a.outOfScope);
    const total = inScope.length;
    const filled = inScope.filter((a) => content[a.key] != null).length;
    const percentage = total === 0 ? 0 : Math.round((filled / total) * 100);
    out[cat.key] = { filled, total, percentage };
  }
  return out;
}
