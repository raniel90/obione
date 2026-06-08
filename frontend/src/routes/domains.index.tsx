import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getDomains } from "@/services/domainService";
import { getProjects } from "@/services/projectService";
import type { Domain } from "@/types/domain";
import type { Project } from "@/types/project";
import { domainObservatory, domainStatusLabels } from "@/lib/domain-observatory";
import { domainCommunities, communityKnowledge } from "@/lib/community-data";
import {
  Plus,
  Layers,
  Telescope,
  Activity,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Radar,
  Users,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/domains/")({
  head: () => ({
    meta: [
      { title: "Domínios observacionais — ObiOne" },
      {
        name: "description",
        content:
          "Espaços contextuais onde projetos, fenômenos e conhecimento organizacional são observados.",
      },
    ],
  }),
  component: DomainsPage,
});

/* ----------------------------- Hero KPIs ----------------------------- */

function HeroKpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

/* ----------------------------- Status pill ----------------------------- */

const statusTone: Record<string, string> = {
  ativo: "bg-success/10 text-success border-success/20",
  "em-formação": "bg-info/10 text-info border-info/20",
  monitorado: "bg-foreground/5 text-foreground/70 border-border",
  "em-revisão": "bg-warning/15 text-warning border-warning/25",
};

function StatusPill({ status }: { status: keyof typeof statusTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        statusTone[status],
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {domainStatusLabels[status as keyof typeof domainStatusLabels]}
    </span>
  );
}

/* ----------------------------- Page ----------------------------- */

function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    getDomains().then(setDomains);
    getProjects().then(setProjects);
  }, []);

  const totalProjects = projects.length;
  const totalPhenomena = Object.values(domainObservatory).reduce(
    (sum, d) => sum + d.phenomena.length,
    0,
  );
  const totalInsights = Object.values(domainObservatory).reduce(
    (sum, d) => sum + d.insights.length,
    0,
  );

  return (
    <AppShell>
      <PageHeader
        title="Domínios observacionais"
        description="Espaços contextuais onde projetos, fenômenos e conhecimento organizacional são observados."
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/domains/new">
              <Plus className="h-3.5 w-3.5" />
              Novo domínio
            </Link>
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10">
        {/* Hero summary */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Visão agregada do observatório
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              {domains.length} contextos analíticos
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <HeroKpi label="Domínios observados" value={domains.length} icon={Layers} />
            <HeroKpi label="Projetos vinculados" value={totalProjects} icon={Activity} />
            <HeroKpi label="Fenômenos identificados" value={totalPhenomena} icon={Radar} />
            <HeroKpi label="Insights gerados" value={totalInsights} icon={Sparkles} />
          </div>
        </section>

        {/* Grid */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Núcleos de observação
            </h2>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((d) => {
              const obs = domainObservatory[d.id];
              const community = domainCommunities.find((c) => c.domainId === d.id);
              return (
                <Link
                  key={d.id}
                  to="/domains/$id"
                  params={{ id: d.id }}
                  className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-foreground/30 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono uppercase tracking-wider">{obs?.type}</span>
                        </div>
                        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                          {d.name}
                        </h3>
                      </div>
                    </div>
                    {obs && <StatusPill status={obs.status} />}
                  </div>

                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                    {d.description}
                  </p>

                  {obs && (
                    <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        <Radar className="h-3 w-3" />
                        Fenômeno observado
                      </div>
                      <p className="mt-1 text-[12.5px] leading-snug text-foreground">
                        {obs.mainPhenomenon}
                      </p>
                    </div>
                  )}

                  {/* Engagement */}
                  {obs && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Engajamento</span>
                        <span className="font-mono text-foreground">{obs.engagement}%</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground transition-all duration-500"
                          style={{ width: `${obs.engagement}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {community && (
                    <div className="mt-4 rounded-md border border-dashed border-border bg-background p-3">
                      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3 w-3" />
                          Comunidade observacional
                        </span>
                        <span className="font-mono text-foreground/70">
                          {String(community.participants).padStart(2, "0")} part.
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {community.discussions} discussões
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {community.insights} insights
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {communityKnowledge.filter((k) => k.domain === d.name && k.status === "Consolidado").length} conhecimentos
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="font-mono">
                      {String(d.projectCount).padStart(2, "0")} projetos vinculados
                    </span>
                    <span className="inline-flex items-center gap-1 text-foreground/80 transition-colors group-hover:text-foreground">
                      <Telescope className="h-3.5 w-3.5" />
                      Observar
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Comunidade conceitual */}
        <section className="mt-10 rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                Cada domínio possui uma comunidade observacional
              </h3>
              <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
                Formada por participantes autorizados, essa comunidade ajuda a
                interpretar fenômenos e transformar observações em conhecimento.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-[12px]">
              <Link to="/community">Acessar comunidade</Link>
            </Button>
          </div>
        </section>

        {/* Footer hint about MPO */}
        <section className="mt-10 rounded-xl border border-dashed border-border bg-muted/20 p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Cada domínio agrega atributos gerais, específicos e intermediários do MPO,
              transformando observações em conhecimento organizacional aplicável à tomada de
              decisão.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
