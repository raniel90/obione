import { Progress } from "@/components/ui/progress";
import type { StatusDistribution } from "@/lib/api/types";

interface Props {
  totalProjects: number;
  avgCoverage: number;
  status: StatusDistribution;
}

export function CockpitKpis({ totalProjects, avgCoverage, status }: Props) {
  const pct = Math.round(avgCoverage);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-md border p-4">
        <p className="text-xs text-muted-foreground">Projetos</p>
        <p className="mt-1 text-2xl font-bold">{totalProjects}</p>
      </div>
      <div className="rounded-md border p-4">
        <p className="text-xs text-muted-foreground">Cobertura média</p>
        <p className="mt-1 text-2xl font-bold">{pct}%</p>
        <Progress value={pct} className="mt-2" />
      </div>
      <div className="rounded-md border p-4">
        <p className="text-xs text-muted-foreground">Status</p>
        <p className="mt-1 text-sm">
          Registrados {status.registered} · Extraídos {status.extracted} · Revisados{" "}
          {status.reviewed}
        </p>
      </div>
    </div>
  );
}
