import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { getDomainById } from "@/services/domainService";
import { getProjectsByDomain } from "@/services/projectService";
import type { Domain } from "@/types/domain";
import type { Project, ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import type { ProjectStatus } from "@/lib/mock-data";
import { domainObservatory, domainStatusLabels } from "@/lib/domain-observatory";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Layers,
  Radar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  GitBranch,
  FileText,
  MessageSquare,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/domains/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Domínio ${params.id} — ObiOne` },
      {
        name: "description",
        content: "Contexto observacional de domínio no ObiOne.",
      },
    ],
  }),
  component: DomainDetailPage,
});

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus } as const;
const obsIcon = {
  vínculo: GitBranch,
  artefato: FileText,
  insight: Sparkles,
  fenômeno: Radar,
  discussão: MessageSquare,
} as const;

const statusCodeToLegacy: Record<ProjectStatusCode, ProjectStatus> = {
  ACTIVE: "active",
  PLANNED: "planning",
  OBSERVATION: "planning",
  REVIEW: "review",
  RISK: "review",
  PAUSED: "paused",
  CLOSED: "completed",
};

const typeCodeToLabel: Record<ProjectTypeCode, string> = {
  STRATEGIC: "Estratégico",
  MANAGERIAL: "Gerencial",
  HYBRID: "Híbrido",
};

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </h2>
      {hint && <span className="font-mono text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

function DomainDetailPage() {
  const { id } = Route.useParams();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [linked, setLinked] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getDomainById(id), getProjectsByDomain(id)]).then(([d, ps]) => {
      if (cancelled) return;
      setDomain(d);
      setLinked(ps);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Carregando domínio…" />
      </AppShell>
    );
  }

  if (!domain) {
    return (
      <AppShell>
        <PageHeader
          title="Domínio não encontrado"
          description="Este contexto observacional não está disponível."
        />
        <div className="px-6 py-6 md:px-10">
          <Button asChild variant="outline" size="sm">
            <Link to="/domains">Voltar para domínios</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const obs = domainObservatory[domain.id];

  return (
    <AppShell>
      <div className="border-b border-border bg-background">
        <div className="px-6 pt-5 md:px-10">
          <Link
            to="/domains"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Domínios observacionais
          </Link>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-end md:justify-between md:px-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-mono uppercase tracking-wider">{obs?.type}</span>
              {obs && (
                <>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="uppercase tracking-wider">{domainStatusLabels[obs.status]}</span>
                </>
              )}
            </div>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
              Domínio: {domain.name}
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
              {obs?.objective ?? domain.description}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 md:px-10 space-y-10">
        {/* 1. KPIs */}
        <section>
          <SectionTitle hint="atributos intermediários">Indicadores do domínio</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Projetos vinculados" value={linked.length} icon={Activity} />
            <Kpi label="Risco médio" value={obs?.risk ?? "—"} icon={AlertTriangle} />
            <Kpi label="Engajamento médio" value={`${obs?.engagement ?? 0}%`} icon={Sparkles} />
            <Kpi label="Fenômenos ativos" value={obs?.activePhenomena ?? 0} icon={Radar} />
          </div>
        </section>

        {/* 2. Linked projects */}
        <section>
          <SectionTitle hint={`${linked.length} projetos`}>Projetos vinculados</SectionTitle>
          {linked.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-[12.5px] text-muted-foreground">
              Nenhum projeto vinculado a este domínio ainda.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {linked.map((p) => {
                const legacyStatus = statusCodeToLegacy[p.status];
                return (
                  <Link
                    key={p.id}
                    to="/projects/$id"
                    params={{ id: p.id }}
                    className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono uppercase tracking-wider">
                            {typeCodeToLabel[p.type]}
                          </span>
                        </div>
                        <h3 className="mt-0.5 truncate text-[14px] font-semibold tracking-tight text-foreground">
                          {p.name}
                        </h3>
                      </div>
                      <StatusBadge status={legacyStatus} />
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progresso</span>
                        <span className="font-mono text-foreground">{p.progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                      <span className="truncate">Último evento: {p.summary.slice(0, 42)}…</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Phenomena */}
        <section>
          <SectionTitle hint="atributos específicos">Fenômenos observados</SectionTitle>
          {!obs || obs.phenomena.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-[12.5px] text-muted-foreground">
              Linha de base ainda em formação — sem fenômenos consolidados.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {obs.phenomena.map((ph) => {
                const TrendIcon = trendIcon[ph.trend];
                return (
                  <div key={ph.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Radar className="h-3 w-3" /> Fenômeno
                      </div>
                      <TrendIcon
                        className={cn(
                          "h-3.5 w-3.5",
                          ph.trend === "up" && "text-warning",
                          ph.trend === "down" && "text-success",
                          ph.trend === "stable" && "text-muted-foreground",
                        )}
                      />
                    </div>
                    <h3 className="mt-2 text-[14px] font-semibold leading-snug tracking-tight text-foreground">
                      {ph.title}
                    </h3>
                    <ul className="mt-3 space-y-1">
                      {ph.evidences.map((e, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[12px] text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border" />
                          {e}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 border-t border-border pt-3 text-[11.5px]">
                      <span className="text-muted-foreground">Impacto: </span>
                      <span className="text-foreground">{ph.impact}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Insights */}
        <section>
          <SectionTitle hint="interpretações">Insights do domínio</SectionTitle>
          <div className="mt-3 space-y-3">
            {obs?.insights.map((it) => (
              <div key={it.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> {it.signal}
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-foreground">
                  “{it.narrative}”
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Feed */}
        <section>
          <SectionTitle>Últimas observações</SectionTitle>
          <ol className="mt-3 space-y-2">
            {obs?.observations.map((o) => {
              const Icon = obsIcon[o.type];
              return (
                <li
                  key={o.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-relaxed text-foreground">{o.text}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="capitalize">{o.type}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{o.actor}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="font-mono">{o.timeAgo}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* 6. Attribute map */}
        <section>
          <SectionTitle hint="MPO">Mapa de atributos</SectionTitle>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <AttrColumn
              title="Atributos gerais"
              items={[
                { label: "Domínio", value: domain.name },
                { label: "Tipo", value: obs?.type ?? "—" },
                { label: "Projetos", value: String(linked.length) },
              ]}
            />
            <AttrColumn
              title="Atributos específicos"
              items={[
                { label: "Fenômenos ativos", value: String(obs?.activePhenomena ?? 0) },
                { label: "Observações registradas", value: String(obs?.observations.length ?? 0) },
                { label: "Artefatos vinculados", value: String(linked.length * 3) },
              ]}
            />
            <AttrColumn
              title="Atributos intermediários"
              items={[
                { label: "Risco médio", value: obs?.risk ?? "—" },
                { label: "Engajamento", value: `${obs?.engagement ?? 0}%` },
                { label: "Maturidade", value: obs?.maturity ?? "—" },
              ]}
              tone="intermediate"
            />
          </div>
          <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <Eye className="h-3 w-3" />
            Atributos agregados pelo observatório para interpretar este contexto.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function AttrColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: { label: string; value: string }[];
  tone?: "intermediate";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        tone === "intermediate" ? "border-foreground/20" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Layers className="h-3 w-3" /> {title}
      </div>
      <dl className="mt-3 space-y-2">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between text-[12.5px]">
            <dt className="text-muted-foreground">{i.label}</dt>
            <dd className="font-mono text-foreground">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
