import { Progress } from "@/components/ui/progress";
import type { StatusDistribution } from "@/lib/api/types";

interface Props {
  totalProjects: number;
  avgCoverage: number;
  status: StatusDistribution;
}

const STATUS_ROWS = [
  { key: "registered", label: "Registrados", dot: "bg-muted-foreground" },
  { key: "extracted", label: "Extraídos", dot: "bg-info" },
  { key: "reviewed", label: "Revisados", dot: "bg-success" },
] as const;

/**
 * Portfolio headline metrics as a single divided stat panel (not a grid of
 * identical cards): a count, a coverage gauge, and a color-coded status
 * breakdown.
 */
export function CockpitKpis({ totalProjects, avgCoverage, status }: Props) {
  const pct = Math.round(avgCoverage);
  return (
    <div className="grid divide-y rounded-lg border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Projetos
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{totalProjects}</p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Cobertura média
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{pct}%</p>
        <Progress value={pct} className="mt-3 h-1.5" />
      </div>

      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {STATUS_ROWS.map((row) => (
            <li key={row.key} className="flex items-center gap-2">
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${row.dot}`} />
              <span className="tabular-nums">
                {row.label} {status[row.key]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
