import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Sparkline } from "@/components/sparkline";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import type { Project as LegacyProject, ProjectStatus } from "@/lib/mock-data";
import type { Project as SvcProject, ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import type { Domain as SvcDomain } from "@/types/domain";
import { getProjects } from "@/services/projectService";
import { getDomains } from "@/services/domainService";
import { getKnowledge } from "@/services/knowledgeService";
import { getFeed, type FeedEvent } from "@/services/feedService";
import { FeedEventItem } from "@/components/feed-event-item";
import type { Knowledge, KnowledgeConfidenceCode } from "@/types/knowledge";
import {
  Plus,
  LayoutGrid,
  Activity,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

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
  to,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number[];
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5 transition-opacity group-hover:opacity-0" />
        {to && (
          <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
        {trend && <Sparkline data={trend} className="text-foreground/70" width={70} height={22} />}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
      >
        {body}
      </Link>
    );
  }

  return <div className="rounded-xl border border-border bg-card p-4">{body}</div>;
}

/* ---------------------- Insights do Observatório -------------------------- */

const confidenceDot: Record<KnowledgeConfidenceCode, string> = {
  LOW: "bg-muted-foreground/50",
  MEDIUM: "bg-info",
  HIGH: "bg-success",
};

const confidenceLabel: Record<KnowledgeConfidenceCode, string> = {
  LOW: "confiança baixa",
  MEDIUM: "confiança média",
  HIGH: "confiança alta",
};

function InsightCard({
  k,
  domainName,
  domainSlug,
}: {
  k: Knowledge;
  domainName: string;
  domainSlug?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[14px] font-semibold leading-snug text-foreground">{k.title}</h3>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{k.summary}</p>

      <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
        <span className="font-mono uppercase tracking-wider">{domainName}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${confidenceDot[k.confidence]}`} />
          {confidenceLabel[k.confidence]}
        </span>
      </div>
    </>
  );

  if (!domainSlug) {
    return (
      <article className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5">
        {body}
      </article>
    );
  }

  return (
    <Link
      to="/community/$slug"
      params={{ slug: domainSlug }}
      className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
    >
      {body}
    </Link>
  );
}

/* --------------------------------- Página --------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
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
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProjects(),
      getDomains(),
      getKnowledge().catch(() => [] as Knowledge[]),
      getFeed({ limit: 6 }).catch(() => [] as FeedEvent[]),
    ]).then(([svcProjects, svcDomains, knowledgeList, feed]) => {
      if (cancelled) return;
      const domainMap = new Map(svcDomains.map((d) => [d.id, d.name] as const));
      setProjects(svcProjects.map((p) => toLegacyProject(p, domainMap)));
      setDomains(svcDomains);
      setKnowledge(knowledgeList.slice(0, 4));
      setFeedEvents(feed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const domainNameById = new Map(domains.map((d) => [d.id, d.name] as const));
  const domainSlugById = new Map(domains.map((d) => [d.id, d.slug] as const));

  const active = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;

  return (
    <AppShell>
      <PageHeader
        title="Observatório de Projetos"
        description="Central viva de inteligência colaborativa: observe fenômenos, interprete padrões e acompanhe a evolução estratégica dos projetos monitorados."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/projects">
                Ver todos os projetos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/projects/new">
                <Plus className="h-3.5 w-3.5" />
                Novo projeto
              </Link>
            </Button>
          </div>
        }
      />

      <div className="px-6 py-6 md:px-10">
        {/* ---------- Visão Operacional ---------- */}
        <section>
          <SectionHeader
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
            />
            <ObservationalKpi
              label="Domínios observados"
              value={domains.length}
              hint="campos de estudo"
              icon={Layers}
              to="/domains"
            />
            <ObservationalKpi
              label="Ciclos concluídos"
              value={completed}
              hint="aprendizado consolidado"
              icon={CheckCircle2}
            />
          </div>
        </section>

        {/* ---------- Insights do Observatório ---------- */}
        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader
              title="Conhecimento consolidado pela comunidade"
              description="Aprendizados reais que nasceram do ciclo observação → discussão → conhecimento."
              action={
                <Link
                  to="/community"
                  className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver todos
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {knowledge.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
                Nenhum conhecimento consolidado ainda — consolide discussões nas comunidades de
                domínio (ou use a Sintetizadora) para que os aprendizados apareçam aqui.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {knowledge.map((k) => (
                  <InsightCard
                    key={k.id}
                    k={k}
                    domainName={domainNameById.get(k.domainId) ?? "—"}
                    domainSlug={domainSlugById.get(k.domainId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Atividade recente */}
          <aside>
            <SectionHeader
              title="Atividade recente"
              action={
                <Link
                  to="/feed"
                  className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver todos
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="mt-4 rounded-xl border border-border bg-card">
              {feedEvents.length === 0 ? (
                <p className="p-4 text-[12.5px] leading-relaxed text-muted-foreground">
                  Sem atividade registrada ainda — observações, discussões e conhecimentos
                  aparecerão aqui.
                </p>
              ) : (
                <ul className="divide-y divide-border px-4">
                  {feedEvents.map((e) => (
                    <FeedEventItem key={`${e.kind}-${e.id}`} e={e} />
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
