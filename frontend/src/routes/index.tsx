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
import { getKnowledge } from "@/services/knowledgeService";
import { getFeed, type FeedEvent } from "@/services/feedService";
import { getPhenomena } from "@/services/phenomenonService";
import { getMpoCategories } from "@/services/mpoAttributeService";
import type { Knowledge, KnowledgeConfidenceCode } from "@/types/knowledge";
import type { Phenomenon, PhenomenonImpact, PhenomenonTrend } from "@/types/phenomenon";
import type { MpoCategory } from "@/types/mpoAttribute";
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
  MessageSquare,
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

const impactTone: Record<PhenomenonImpact, string> = {
  HIGH: "border-destructive/30 text-destructive bg-destructive/5",
  MEDIUM: "border-warning/30 text-warning bg-warning/5",
  LOW: "border-success/30 text-success bg-success/5",
};

const impactLabel: Record<PhenomenonImpact, string> = {
  HIGH: "Risco elevado",
  MEDIUM: "Sob observação",
  LOW: "Padrão saudável",
};

const trendIcon: Record<PhenomenonTrend, typeof TrendingUp> = {
  GROWING: TrendingUp,
  DECREASING: TrendingDown,
  STABLE: Minus,
};

function PhenomenonCard({ p, domainName }: { p: Phenomenon; domainName: string }) {
  const TrendIcon = trendIcon[p.trend];
  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            impactTone[p.impact],
          )}
        >
          <span className="h-1 w-1 rounded-full bg-current" />
          {impactLabel[p.impact]}
        </span>
        <TrendIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <h3 className="mt-3 text-[14px] font-semibold leading-snug tracking-tight text-foreground">
        {p.name}
      </h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{p.description}</p>

      <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
        <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          <span className="font-mono uppercase tracking-wider">{domainName}</span>
          <span>
            {p.evidenceCount} evidência{p.evidenceCount === 1 ? "" : "s"} observada
            {p.evidenceCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ------------------- Camada 3: Insights do Observatório ------------------- */

const confidencePercent: Record<KnowledgeConfidenceCode, number> = {
  LOW: 35,
  MEDIUM: 65,
  HIGH: 90,
};

const confidenceLabel: Record<KnowledgeConfidenceCode, string> = {
  LOW: "baixa",
  MEDIUM: "média",
  HIGH: "alta",
};

function InsightCard({ k, domainName }: { k: Knowledge; domainName: string }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Conhecimento consolidado
        </span>
        <span className="font-mono text-[10.5px] text-muted-foreground">
          confiança {confidenceLabel[k.confidence]}
        </span>
      </div>

      <div>
        <h3 className="text-[13.5px] font-semibold leading-snug text-foreground">{k.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/90">{k.summary}</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="font-mono uppercase tracking-wider">{domainName}</span>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/80"
            style={{ width: `${confidencePercent[k.confidence]}%` }}
          />
        </div>
      </div>
    </article>
  );
}

/* ----------------------- Camada 4: Últimas Observações -------------------- */

const feedIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  observation: Radar,
  discussion: MessageSquare,
  knowledge: Sparkles,
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ontem" : `${days} dias atrás`;
}

function FeedEventItem({ e }: { e: FeedEvent }) {
  const Icon = feedIcon[e.kind] ?? Eye;
  return (
    <li className="flex gap-3 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-foreground">{e.title}</p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{e.actorName ?? "Observatório"}</span>
          {e.projectName && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="truncate font-mono uppercase tracking-wider">{e.projectName}</span>
            </>
          )}
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="whitespace-nowrap">{relativeTime(e.createdAt)}</span>
        </div>
      </div>
    </li>
  );
}

/* ------------------- Mapa de Atributos Observáveis (lente MPO) ------------ */

function MpoCategoryCard({ category }: { category: MpoCategory }) {
  const inScope = category.attributes.filter((a) => a.type !== "fora_de_escopo");
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[13.5px] font-semibold tracking-tight text-foreground">
          {category.label}
        </h3>
        <span className="font-mono text-[10.5px] text-muted-foreground">
          {inScope.length} atributo{inScope.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {inScope.map((a) => (
          <span
            key={a.id}
            className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {a.name}
          </span>
        ))}
      </div>
    </article>
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
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [phenomena, setPhenomena] = useState<Phenomenon[]>([]);
  const [mpoCategories, setMpoCategories] = useState<MpoCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProjects(),
      getDomains(),
      getKnowledge().catch(() => [] as Knowledge[]),
      getFeed({ limit: 6 }).catch(() => [] as FeedEvent[]),
      getPhenomena().catch(() => [] as Phenomenon[]),
      getMpoCategories().catch(() => [] as MpoCategory[]),
    ]).then(([svcProjects, svcDomains, knowledgeList, feed, phenomenaList, categories]) => {
      if (cancelled) return;
      const domainMap = new Map(svcDomains.map((d) => [d.id, d.name] as const));
      setProjects(svcProjects.map((p) => toLegacyProject(p, domainMap)));
      setDomains(svcDomains);
      setKnowledge(knowledgeList.slice(0, 4));
      setFeedEvents(feed);
      setPhenomena(
        [...phenomenaList].sort((a, b) => b.evidenceCount - a.evidenceCount).slice(0, 4),
      );
      setMpoCategories(categories);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const domainNameById = new Map(domains.map((d) => [d.id, d.name] as const));

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
                {phenomena.length} fenômeno{phenomena.length === 1 ? "" : "s"} em acompanhamento
              </span>
            }
          />
          {phenomena.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
              Nenhum fenômeno em acompanhamento ainda — fenômenos surgem do cruzamento das
              observações registradas nos projetos.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {phenomena.map((p) => (
                <PhenomenonCard
                  key={p.id}
                  p={p}
                  domainName={domainNameById.get(p.domainId) ?? "—"}
                />
              ))}
            </div>
          )}
        </section>

        {/* ---------- CAMADA 3 — Insights do Observatório ---------- */}
        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader
              eyebrow="Camada 3 · Insights do observatório"
              title="Conhecimento consolidado pela comunidade"
              description="Aprendizados reais que nasceram do ciclo observação → discussão → conhecimento."
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
                  />
                ))}
              </div>
            )}
          </div>

          {/* CAMADA 4 — Últimas Observações */}
          <aside>
            <SectionHeader eyebrow="Camada 4 · Feed" title="Atividade recente" />
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

        {/* ---------- Mapa de Atributos Observáveis (lente MPO) ---------- */}
        <section className="mt-12">
          <SectionHeader
            eyebrow="MPO · Granularidade da observação"
            title="A lente de observação (MPO · Quadro 37)"
            description="Os atributos que o observatório sabe enxergar, organizados nas 8 categorias do Modelo de Observatório de Projetos."
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

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {mpoCategories.map((category) => (
              <MpoCategoryCard key={category.key} category={category} />
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
