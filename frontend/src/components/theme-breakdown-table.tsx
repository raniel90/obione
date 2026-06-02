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
import type { ThemeBreakdown } from "@/lib/api/types";

export function ThemeBreakdownTable({ themes }: { themes: ThemeBreakdown[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Temática</TableHead>
          <TableHead>Projetos</TableHead>
          <TableHead>Cobertura</TableHead>
          <TableHead>Status (R/E/Rev)</TableHead>
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
                {s.registered}/{s.extracted}/{s.reviewed}
              </TableCell>
              <TableCell>{Math.round(t.reviewed_pct)}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
