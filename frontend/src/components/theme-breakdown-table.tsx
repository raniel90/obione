import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DomainBadge } from "@/components/domain-badge";
import type { StatusDistribution, ThemeBreakdown } from "@/lib/api/types";

const STATUS_SEGMENTS = [
  { key: "registered", label: "Registrados", dot: "bg-muted-foreground" },
  { key: "extracted", label: "Extraídos", dot: "bg-info" },
  { key: "reviewed", label: "Revisados", dot: "bg-success" },
] as const;

/** Color-coded registered / extracted / reviewed counts (shared legend). */
function StatusDots({ status }: { status: StatusDistribution }) {
  return (
    <div className="flex items-center gap-3">
      {STATUS_SEGMENTS.map((seg) => (
        <span
          key={seg.key}
          className="flex items-center gap-1.5 tabular-nums"
          title={`${seg.label}: ${status[seg.key]}`}
        >
          <span aria-hidden className={`size-2 shrink-0 rounded-full ${seg.dot}`} />
          {status[seg.key]}
        </span>
      ))}
    </div>
  );
}

export function ThemeBreakdownTable({ themes }: { themes: ThemeBreakdown[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Temática</TableHead>
          <TableHead>Projetos</TableHead>
          <TableHead>Cobertura</TableHead>
          <TableHead title="Registrados · Extraídos · Revisados">Status</TableHead>
          <TableHead>Revisado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {themes.map((t) => {
          const pct = Math.round(t.avg_coverage);
          const s = t.status_distribution;
          return (
            <TableRow key={t.domain}>
              <TableCell>
                <Link to={`/projects?domain=${t.domain}`} className="hover:underline">
                  <DomainBadge domain={t.domain} />
                </Link>
              </TableCell>
              <TableCell>{t.count}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-sm">{pct}%</span>
                  <Progress value={pct} className="w-24" />
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <StatusDots status={s} />
              </TableCell>
              <TableCell>{Math.round(t.reviewed_pct)}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
