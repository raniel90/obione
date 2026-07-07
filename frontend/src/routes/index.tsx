import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Project as LegacyProject, ProjectStatus } from "@/lib/mock-data";
import type { Project as SvcProject, ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import type { Domain as SvcDomain } from "@/types/domain";
import { getProjects } from "@/services/projectService";
import { getDomains } from "@/services/domainService";
import { getKnowledge } from "@/services/knowledgeService";
import { getFeed, type FeedEvent } from "@/services/feedService";
import { FeedEventItem } from "@/components/feed-event-item";
import type { Knowledge, KnowledgeConfidenceCode } from "@/types/knowledge";
import { Plus, LayoutGrid, Users as UsersIcon, ArrowRight, ArrowUpRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

/* ------------------------------- Panorama --------------------------------- */

function PanoramaCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  footer,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  footer?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5 transition-opacity group-hover:opacity-0" />
        <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        <span className="text-[12px] text-muted-foreground">{hint}</span>
      </div>
      {footer && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[11.5px] text-muted-foreground">
          {footer}
        </div>
      )}
    </Link>
  );
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
  title,
  tooltip,
  action,
}: {
  title: string;
  tooltip?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h2>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  className="h-3.5 w-3.5 cursor-help text-muted-foreground/70 transition-colors hover:text-foreground"
                  aria-label={`Sobre ${title}`}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-[12px] leading-relaxed">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {action}
    </div>
  );
}

function ObservatoryDashboard() {
  const { isClient, user } = useCurrentUser();
  const [projects, setProjects] = useState<LegacyProject[]>([]);
  const [domains, setDomains] = useState<SvcDomain[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
      setFeedLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!feedLoaded || !isClient || !user?.email) return;
    if (typeof window === "undefined") return;
    const key = `obione-novidades-seen:${user.email}`;
    const lastSeen = localStorage.getItem(key);
    const count = lastSeen
      ? feedEvents.filter((e) => new Date(e.createdAt) > new Date(lastSeen)).length
      : feedEvents.length;
    setUnreadCount(count);
    localStorage.setItem(key, new Date().toISOString());
  }, [feedEvents, feedLoaded, isClient, user?.email]);

  const domainNameById = new Map(domains.map((d) => [d.id, d.name] as const));
  const domainSlugById = new Map(domains.map((d) => [d.id, d.slug] as const));

  // A project is under observation until its cycle closes — the two counts
  // must add up to the total shown on the card.
  const completed = projects.filter((p) => p.status === "completed").length;
  const active = projects.length - completed;

  // Top domains by project count, for the Domínios card footer.
  const topDomains = domains
    .map((d) => ({
      name: d.name,
      count: projects.filter((p) => p.domainId === d.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <AppShell>
      <PageHeader
        title={isClient ? "Meu projeto" : "Observatório de Projetos"}
        description={
          isClient
            ? "Acompanhe o andamento do seu projeto e veja o que a comunidade aprendeu."
            : "O que a consultoria está observando agora e o que a comunidade já aprendeu com isso."
        }
        actions={
          isClient ? undefined : (
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/projects/new">
                <Plus className="h-3.5 w-3.5" />
                Novo projeto
              </Link>
            </Button>
          )
        }
      />

      <div className="px-6 py-6 md:px-10">
        {/* ---------- Novidades (somente cliente) ---------- */}
        {isClient && (
          <section className="mb-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                  Novidades no seu projeto
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] font-medium text-info">
                    {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
                  </span>
                )}
              </div>
              <Link
                to="/feed"
                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver todas
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Acompanhe e participe da conversa do seu projeto.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-muted/30">
              {feedEvents.length === 0 ? (
                <p className="p-5 text-[12.5px] leading-relaxed text-muted-foreground">
                  Ainda não há novidades no seu projeto.
                </p>
              ) : (
                <ul className="divide-y divide-border px-4">
                  {feedEvents.slice(0, 5).map((e) => (
                    <FeedEventItem key={`${e.kind}-${e.id}`} e={e} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ---------- Visão Operacional ---------- */}
        <section>
          <SectionHeader
            title="Panorama"
            tooltip="Cada projeto pertence a uma comunidade, o espaço onde suas observações viram conversas e aprendizados. O domínio é a área de atuação que a agrupa."
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <PanoramaCard
              label="Comunidades"
              value={domains.length}
              hint="espaços de conversa por área de atuação"
              icon={UsersIcon}
              to="/community"
              footer={
                <>
                  {topDomains.map((d) => (
                    <span key={d.name} className="inline-flex items-baseline gap-1">
                      {d.name}
                      <span className="font-mono text-foreground">{d.count}</span>
                    </span>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground">
                    Ver todos
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </>
              }
            />
            <PanoramaCard
              label="Projetos"
              value={projects.length}
              hint="casos de clientes observados"
              icon={LayoutGrid}
              to="/projects"
              footer={
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-info" />
                    {active} em observação
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {completed} concluído{completed === 1 ? "" : "s"}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground">
                    Ver todos
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </>
              }
            />
          </div>
        </section>

        {/* ---------- Insights do Observatório ---------- */}
        <section className={`mt-12 grid grid-cols-1 gap-6 ${isClient ? "" : "lg:grid-cols-3"}`}>
          <div className={isClient ? "" : "lg:col-span-2"}>
            <SectionHeader
              title="Aprendizados"
              tooltip="Aprendizados que a comunidade consolidou a partir das conversas dos projetos. Abra um card para vê-lo na comunidade."
              action={
                <Link
                  to="/community"
                  hash="aprendizados"
                  className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver todos
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {knowledge.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
                Nenhum aprendizado consolidado ainda: consolide conversas nas comunidades de domínio
                (ou use a Sintetizadora) para que os aprendizados apareçam aqui.
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

          {/* Atividade recente (somente staff) */}
          {!isClient && (
            <aside>
              <SectionHeader
                title="Atividade recente"
                tooltip="Observações, conversas e aprendizados registrados nos projetos, do mais recente ao mais antigo."
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
                    Sem atividade registrada ainda: observações, conversas e aprendizados aparecerão
                    aqui.
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
          )}
        </section>
      </div>
    </AppShell>
  );
}
