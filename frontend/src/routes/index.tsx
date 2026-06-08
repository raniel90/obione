import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ProjectCard } from "@/components/project-card";
import { Sparkline } from "@/components/sparkline";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import type { Project as LegacyProject, ProjectStatus } from "@/lib/mock-data";
import type { Project as SvcProject, ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import type { Domain as SvcDomain } from "@/types/domain";
import { getProjects } from "@/services/projectService";
import { getDomains } from "@/services/domainService";
import {
  phenomena,
  insights,
  observations,
  attributeMaps,
  observatoryKpis,
} from "@/lib/observatory-data";
import {
  Plus,
  LayoutGrid,
  Activity,
  Layers,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Radar,
  AlertTriangle,
  MessageSquare,
  GitBranch,
  FileText,
  Eye,
  ArrowRight,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusCodeToLegacy: Record<ProjectStatusCode, ProjectStatus> = {
  OBSERVATION: "active",
  PLANNED: "planning",
  ACTIVE: "active",
  RISK: "review",
  REVIEW: "review",
  PAUSED: "paused",
  CLOSED: "completed",
};

const typeCodeToLabel: Record<ProjectTypeCode, "Estratégico" | "Gerencial" | "Híbrido"> = {
  STRATEGIC: "Estratégico",
  MANAGERIAL: "Gerencial",
  HYBRID: "Híbrido",
};

function toLegacyProject(p: SvcProject, domainMap: Map<string, string>): LegacyProject {
  return {
    id: p.id,
    name: p.name,
    domain: domainMap.get(p.domainId) ?? "—",
    domainId: p.domainId,
    status: statusCodeToLegacy[p.status],
    summary: p.summary,
    progress: p.progress,
    updatedAt: p.updatedAt,
    tags: p.expectedPhenomena,
    model: typeCodeToLabel[p.type],
    owner: p.consultantName ?? "—",
    clientName: p.clientName ?? "—",
  };
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Observatório de Projetos — ObiOne" },
      {
        name: "description",
        content:
          "Central viva de inteligência colaborativa: fenômenos observados, insights e padrões emergentes nos projetos monitorados.",
      },
    ],
  }),
  component: ObservatoryDashboard,
});

/* ----------------------------- Camada 1: KPIs ----------------------------- */

function ObservationalKpi({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
        {trend && <Sparkline data={trend} className="text-foreground/70" width={70} height={22} />}
      </div>
    </div>
  );
}

/* ----------------------- Camada 2: Fenômenos Observados ------------------- */

const severityTone: Record<string, string> = {
  high: "border-destructive/30 text-destructive bg-destructive/5",
  medium: "border-warning/30 text-warning bg-warning/5",
  low: "border-success/30 text-success bg-success/5",
};

const severityLabel: Record<string, string> = {
  high: "Risco elevado",
  medium: "Sob observação",
  low: "Padrão saudável",
};

function PhenomenonCard({ p }: { p: (typeof phenomena)[number] }) {
  const TrendIcon = p.trend === "up" ? TrendingUp : p.trend === "down" ? TrendingDown : Minus;
  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            severityTone[p.severity],
          )}
        >
          <span className="h-1 w-1 rounded-full bg-current" />
          {severityLabel[p.severity]}
        </span>
        <TrendIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <h3 className="mt-3 text-[14px] font-semibold leading-snug tracking-tight text-foreground">
        {p.title}
      </h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{p.description}</p>

      <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
        <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          <span className="font-mono uppercase tracking-wider">{p.domain}</span>
          <span>{p.evidenceCount} evidências observadas</span>
        </div>
        <Sparkline data={p.sparkline} className="text-foreground/80" />
      </div>
    </article>
  );
}

/* ------------------- Camada 3: Insights do Observatório ------------------- */

function InsightCard({ i }: { i: (typeof insights)[number] }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {i.category}
        </span>
        <span className="font-mono text-[10.5px] text-muted-foreground">
          confiança {(i.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <p className="text-[13.5px] leading-relaxed text-foreground">{i.narrative}</p>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="font-mono">{i.signal}</span>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/80"
            style={{ width: `${i.confidence * 100}%` }}
          />
        </div>
      </div>
    </article>
  );
}

/* ----------------------- Camada 4: Últimas Observações -------------------- */

const observationIcon = {
  padrão: Radar,
  discussão: MessageSquare,
  revisão: GitBranch,
  artefato: FileText,
  alerta: AlertTriangle,
  descoberta: Eye,
} as const;

function ObservationItem({ o }: { o: (typeof observations)[number] }) {
  const Icon = observationIcon[o.type];
  return (
    <li className="flex gap-3 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-foreground">{o.text}</p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{o.actor}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="font-mono uppercase tracking-wider">{o.domain}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{o.timeAgo}</span>
        </div>
      </div>
    </li>
  );
}

/* ------------------- Mapa de Atributos Observados ------------------------- */

const toneClass: Record<string, string> = {
  risk: "text-destructive",
  engagement: "text-info",
  maturity: "text-success",
};

function AttributeMapCard({ m }: { m: (typeof attributeMaps)[number] }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Fenômeno observado
          </span>
        </div>
        <span className="font-mono text-[10.5px] text-muted-foreground">MPO</span>
      </div>
      <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-foreground">
        {m.phenomenon}
      </h3>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <AttrGroup title="Atributos gerais" items={m.general} />
        <AttrGroup title="Evidências específicas" items={m.specific} />
        <AttrGroup
          title="Atributos intermediários"
          items={m.intermediate.map((a) => ({
            label: a.label,
            value: a.value,
            className: toneClass[a.tone],
          }))}
          highlight
        />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/70" />
        <p className="text-[12.5px] leading-relaxed text-foreground/90">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Interpretação ·{" "}
          </span>
          {m.interpretation}
        </p>
      </div>
    </article>
  );
}

function AttrGroup({
  title,
  items,
  highlight,
}: {
  title: string;
  items: { label: string; value: string; className?: string }[];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight ? "border-foreground/20 bg-foreground/[0.025]" : "border-border bg-background",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-muted-foreground">{it.label}</span>
            <span className={cn("font-medium text-foreground", it.className)}>{it.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- Página --------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function ObservatoryDashboard() {
  const [projects, setProjects] = useState<LegacyProject[]>([]);
  const [domains, setDomains] = useState<SvcDomain[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProjects(), getDomains()]).then(([svcProjects, svcDomains]) => {
      if (cancelled) return;
      const domainMap = new Map(svcDomains.map((d) => [d.id, d.name] as const));
      setProjects(svcProjects.map((p) => toLegacyProject(p, domainMap)));
      setDomains(svcDomains);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;

  return (
    <AppShell>
      <PageHeader
        title="Observatório de Projetos"
        description="Central viva de inteligência colaborativa: observe fenômenos, interprete padrões e acompanhe a evolução estratégica dos projetos monitorados."
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/projects/new">
              <Plus className="h-3.5 w-3.5" />
              Novo projeto
            </Link>
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10">
        {/* ---------- CAMADA 1 — Visão Operacional ---------- */}
        <section>
          <SectionHeader
            eyebrow="Camada 1 · Visão operacional"
            title="Panorama do observatório"
            description="Indicadores macro do que está atualmente sob observação ativa."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <ObservationalKpi
              label="Projetos monitorados"
              value={projects.length}
              hint="sob observação"
              icon={LayoutGrid}
            />
            <ObservationalKpi
              label="Em observação ativa"
              value={active}
              hint="ciclo corrente"
              icon={Activity}
              trend={[3, 4, 4, 5, 5, 6, active]}
            />
            <ObservationalKpi
              label="Domínios observados"
              value={domains.length}
              hint="campos de estudo"
              icon={Layers}
            />
            <ObservationalKpi
              label="Ciclos concluídos"
              value={completed}
              hint="aprendizado consolidado"
              icon={CheckCircle2}
            />
          </div>
        </section>

        {/* ---------- CAMADA 2 — Fenômenos Observados ---------- */}
        <section className="mt-12">
          <SectionHeader
            eyebrow="Camada 2 · Fenômenos observados"
            title="Padrões, riscos e comportamentos emergentes"
            description="Sinais organizacionais identificados a partir do cruzamento de atributos gerais, específicos e intermediários."
            action={
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                <Radar className="h-3 w-3" />
                {observatoryKpis.patternsDetected} padrões detectados
              </span>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {phenomena.map((p) => (
              <PhenomenonCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* ---------- CAMADA 3 — Insights do Observatório ---------- */}
        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader
              eyebrow="Camada 3 · Insights do observatório"
              title="Inteligência analítica colaborativa"
              description="Narrativas interpretativas geradas pelo observatório a partir dos atributos intermediários."
            />
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {insights.map((i) => (
                <InsightCard key={i.id} i={i} />
              ))}
            </div>
          </div>

          {/* CAMADA 4 — Últimas Observações */}
          <aside>
            <SectionHeader eyebrow="Camada 4 · Feed" title="Últimas observações" />
            <div className="mt-4 rounded-xl border border-border bg-card">
              <ul className="divide-y divide-border px-4">
                {observations.map((o) => (
                  <ObservationItem key={o.id} o={o} />
                ))}
              </ul>
              <button className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
                Ver todas as observações
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </aside>
        </section>

        {/* ---------- Mapa de Atributos Observados ---------- */}
        <section className="mt-12">
          <SectionHeader
            eyebrow="MPO · Granularidade da observação"
            title="Mapa de atributos observados"
            description="Como o ObiOne transforma dados brutos em conhecimento: atributos gerais descrevem, específicos detalham e intermediários interpretam."
          />

          {/* Pipeline visual */}
          <div className="mt-4 hidden items-center gap-2 rounded-xl border border-border bg-card p-3 text-[11px] text-muted-foreground md:flex">
            {[
              "Dados brutos",
              "Atributos gerais",
              "Atributos específicos",
              "Atributos intermediários",
              "Conhecimento coletivo",
            ].map((step, idx, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono uppercase tracking-wider",
                    idx === arr.length - 1
                      ? "border-foreground/30 bg-foreground text-background"
                      : "border-border bg-background",
                  )}
                >
                  {step}
                </span>
                {idx < arr.length - 1 && <ArrowRight className="h-3 w-3" />}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {attributeMaps.map((m) => (
              <AttributeMapCard key={m.id} m={m} />
            ))}
          </div>
        </section>

        {/* ---------- Projetos sob observação (prévia) ---------- */}
        <section className="mt-12">
          <SectionHeader
            eyebrow="Camada operacional"
            title="Projetos sob observação"
            description="Prévia dos projetos atualmente monitorados. Acesse o catálogo completo na página de Projetos."
            action={
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/projects">
                  Ver todos os projetos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects
              .filter((p) => p.status === "active")
              .slice(0, 3)
              .map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
