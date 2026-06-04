import { LayoutDashboard } from "lucide-react";
import { useCockpit } from "@/lib/queries/use-cockpit";
import { useCoverageMatrix } from "@/lib/queries/use-coverage-matrix";
import { CockpitKpis } from "@/components/cockpit-kpis";
import { ThemeBreakdownTable } from "@/components/theme-breakdown-table";
import { CoverageHeatmap } from "@/components/coverage-heatmap";
import { CockpitSynthesisPanel } from "@/components/cockpit-synthesis-panel";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function PortfolioCockpitPage() {
  const cockpitQ = useCockpit();
  const matrixQ = useCoverageMatrix();

  if (cockpitQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (cockpitQ.isError) {
    return (
      <div className="py-12 text-center">
        <p className="mb-3 text-destructive">Erro ao carregar o cockpit.</p>
        <Button variant="outline" size="sm" onClick={() => cockpitQ.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const cockpit = cockpitQ.data!;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cockpit do Portfólio</h1>
      {cockpit.total_projects === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          message="Nenhum projeto no portfólio ainda."
          description="Os indicadores aparecem assim que houver projetos observados."
        />
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
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Cobertura por categoria</h2>
            <p className="text-sm text-muted-foreground">
              Cobertura dos 44 atributos do MPO por dimensão, em cada projeto do portfólio.
            </p>
            {matrixQ.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : matrixQ.isError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
                <p className="mb-2 text-destructive">Erro ao carregar a cobertura.</p>
                <Button variant="outline" size="sm" onClick={() => matrixQ.refetch()}>
                  Tentar de novo
                </Button>
              </div>
            ) : matrixQ.data && matrixQ.data.rows.length > 0 ? (
              <CoverageHeatmap data={matrixQ.data} />
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados de cobertura ainda.</p>
            )}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Sínteses por temática</h2>
            <p className="text-sm text-muted-foreground">
              A Conectora destila padrões, riscos e boas práticas dos projetos de cada
              temática. Você revisa e publica; o cliente vê a versão publicada e anonimizada.
            </p>
            <CockpitSynthesisPanel domains={cockpit.themes.map((t) => t.domain)} />
          </section>
        </>
      )}
    </div>
  );
}
