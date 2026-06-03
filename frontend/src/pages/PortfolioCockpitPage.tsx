import { Link } from "react-router-dom";
import { useCockpit } from "@/lib/queries/use-cockpit";
import { CockpitKpis } from "@/components/cockpit-kpis";
import { ThemeBreakdownTable } from "@/components/theme-breakdown-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function PortfolioCockpitPage() {
  const cockpitQ = useCockpit();

  if (cockpitQ.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (cockpitQ.isError) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="mb-3 text-destructive">Erro ao carregar o cockpit.</p>
        <Button variant="outline" size="sm" onClick={() => cockpitQ.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const cockpit = cockpitQ.data!;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cockpit do Portfólio</h1>
        <Link to="/feed" className="text-sm text-primary hover:underline">
          Novidades
        </Link>
      </div>
      {cockpit.total_projects === 0 ? (
        <p className="text-muted-foreground">Nenhum projeto no portfólio ainda.</p>
      ) : (
        <>
          <CockpitKpis
            totalProjects={cockpit.total_projects}
            avgCoverage={cockpit.avg_coverage_overall}
            status={cockpit.status_distribution}
          />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Por temática</h2>
            <ThemeBreakdownTable themes={cockpit.themes} />
          </section>
        </>
      )}
    </div>
  );
}
