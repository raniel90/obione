import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/mpo/catalog";
import type { CoverageMatrix } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
);

/** Coverage % → semantic bucket (verde alta / âmbar parcial / cinza baixa). */
function cellClasses(pct: number): string {
  if (pct >= 80) return "bg-success text-success-foreground";
  if (pct >= 40) return "bg-warning text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

/**
 * Cross-portfolio coverage heatmap: projects (rows) × the 8 MPO dimensions
 * (columns), each cell colored by coverage %. Reveals dimensions that are
 * systematically under-captured across the portfolio (RF09). Each cell links
 * to its project. Staff-only (rendered inside the cockpit).
 */
export function CoverageHeatmap({ data }: { data: CoverageMatrix }) {
  const { categories, rows } = data;
  const gridTemplateColumns = `minmax(8rem, 1.5fr) repeat(${categories.length}, minmax(3rem, 1fr))`;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[44rem] text-sm" role="table" aria-label="Cobertura por categoria">
          {/* Header row */}
          <div
            className="grid items-end gap-px"
            style={{ gridTemplateColumns }}
            role="row"
          >
            <div role="columnheader" />
            {categories.map((key) => (
              <div
                key={key}
                role="columnheader"
                title={CATEGORY_LABELS[key] ?? key}
                className="px-1 pb-1 text-center text-xs leading-tight text-muted-foreground"
              >
                {CATEGORY_LABELS[key] ?? key}
              </div>
            ))}
          </div>

          {/* Data rows */}
          <div className="space-y-px">
            {rows.map((row) => (
              <div
                key={row.project_id}
                className="grid gap-px"
                style={{ gridTemplateColumns }}
                role="row"
              >
                <Link
                  to={`/projects/${row.project_id}`}
                  title={row.project_name}
                  className="flex items-center truncate rounded-sm px-2 py-2 font-medium hover:underline"
                  role="rowheader"
                >
                  {row.project_name}
                </Link>
                {categories.map((key) => {
                  const pct = Math.round(row.coverages[key] ?? 0);
                  return (
                    <Link
                      key={key}
                      to={`/projects/${row.project_id}`}
                      role="cell"
                      title={`${row.project_name} · ${CATEGORY_LABELS[key] ?? key}: ${pct}%`}
                      className={cn(
                        "flex items-center justify-center rounded-sm py-2 text-xs font-medium tabular-nums transition-opacity hover:opacity-80",
                        cellClasses(pct),
                      )}
                    >
                      {pct}%
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-success" aria-hidden />
          Alta (≥80%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-warning" aria-hidden />
          Parcial (40–79%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-muted" aria-hidden />
          Baixa (&lt;40%)
        </span>
      </div>
    </div>
  );
}
