import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Project as LegacyProject, ProjectStatus } from "@/lib/mock-data";
import type {
  EngagementLevel,
  Project as SvcProject,
  ProjectStatusCode,
  ProjectTypeCode,
  RiskLevel,
} from "@/types/project";
import type { Domain as SvcDomain } from "@/types/domain";
import type {
  Observation as SvcObservation,
  ObservationImpact as SvcObsImpact,
  ObservationRisk as SvcObsRisk,
  ObservationStatus as SvcObsStatus,
} from "@/types/observation";
import type {
  Phenomenon as SvcPhenomenon,
  PhenomenonTrend,
  PhenomenonStatus,
} from "@/types/phenomenon";
import { toast } from "sonner";
import { getProjectById, getProjectCoverage } from "@/services/projectService";
import type { ProjectCoverage } from "@/services/projectService";
import { suggestObservations } from "@/services/aiService";
import type { ObservationSuggestion } from "@/services/aiService";
import { getFeed } from "@/services/feedService";
import type { FeedEvent } from "@/services/feedService";
import { getDomains } from "@/services/domainService";
import {
  createObservation,
  getObservationsByProject,
  linkObservationToDiscussion,
  markObservationAsAnalyzed,
  updateObservation,
} from "@/services/observationService";
import {
  addContribution,
  createDiscussion,
  getDiscussionsByProject,
  statusCodes,
  toCommunityDiscussion,
  visibilityCodes,
} from "@/services/discussionService";
import type { Discussion as SvcDiscussion } from "@/types/discussion";
import { getCurrentUser } from "@/services/authService";
import { getPhenomenaByProject } from "@/services/phenomenonService";
import { getMpoAttributes, getMpoCategories } from "@/services/mpoAttributeService";
import type { MpoCategory } from "@/types/mpoAttribute";
import { type DiscussionStatus, type VisibilityScope } from "@/lib/community-data";
import { getKnowledgeByProject, toCommunityKnowledge } from "@/services/knowledgeService";
import type { CommunityKnowledge } from "@/lib/community-data";
import { BookOpen } from "lucide-react";
import type { ProjectObservation, ProjectPhenomenon } from "@/lib/project-observatory";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Layers,
  Radar,
  Sparkles,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CheckCircle2,
  Eye,
  Plus,
  PenSquare,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function ProjectRouteError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <AppShell>
      <div className="px-6 py-10 md:px-10">
        <h1 className="text-lg font-semibold">Erro ao carregar projeto</h1>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Tentar novamente
        </Button>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/projects/$id")({
  head: () => ({
    meta: [
      { title: "Projeto — ObiOne" },
      {
        name: "description",
        content: "Detalhe observacional de projeto no ObiOne.",
      },
    ],
  }),
  errorComponent: ProjectRouteError,
  component: ProjectDetailPage,
});

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

const updateStatusToLabel: Record<ProjectStatusCode, string> = {
  OBSERVATION: "Em observação",
  PLANNED: "Em observação",
  ACTIVE: "Estável",
  RISK: "Em risco",
  REVIEW: "Em revisão",
  PAUSED: "Em revisão",
  CLOSED: "Encerrado",
};

const riskCodeToLabel: Record<RiskLevel, string> = {
  LOW: "Baixo",
  MODERATE: "Moderado",
  HIGH: "Elevado",
  CRITICAL: "Crítico",
};

function riskLevelTone(level: RiskLevel): "warning" | "success" | "danger" {
  if (level === "CRITICAL" || level === "HIGH") return "danger";
  if (level === "MODERATE") return "warning";
  return "success";
}

function authorIdLabel(id: string) {
  if (!id) return "—";
  return /^\d+$/.test(id) ? `Usuário ${id}` : id;
}

function toLegacyProject(p: SvcProject, domainMap: Map<string, SvcDomain>): LegacyProject {
  return {
    id: p.id,
    name: p.name,
    domain: domainMap.get(p.domainId)?.name ?? "—",
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

const obsImpactMap: Record<SvcObsImpact, ProjectObservation["impact"]> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};
const obsRiskMap: Record<SvcObsRisk, ProjectObservation["risk"]> = {
  LOW: "Baixo",
  MODERATE: "Moderado",
  HIGH: "Elevado",
  CRITICAL: "Crítico",
};
const obsStatusMap: Record<SvcObsStatus, ProjectObservation["status"]> = {
  REGISTERED: "registrada",
  IN_ANALYSIS: "em análise",
  LINKED_TO_DISCUSSION: "associada a discussão",
  CONSOLIDATED: "consolidada",
};

function toProjectObservation(
  o: SvcObservation,
  attrMap: Map<string, string>,
  phenMap: Map<string, string>,
): ProjectObservation {
  return {
    id: o.id,
    title: o.title,
    date: o.createdAt,
    description: o.description,
    attribute: attrMap.get(o.attributeId) ?? o.attributeId ?? "—",
    phenomenon: o.phenomenonId ? (phenMap.get(o.phenomenonId) ?? o.phenomenonId) : "—",
    impact: obsImpactMap[o.impact],
    risk: obsRiskMap[o.risk],
    interpretation: o.interpretation,
    author: o.createdByName ?? authorIdLabel(o.createdBy),
    status: obsStatusMap[o.status],
    aiSuggested: o.origin === "AI_SUGGESTED",
    sourceExcerpt: o.sourceExcerpt,
  };
}

const trendMap: Record<PhenomenonTrend, ProjectPhenomenon["trend"]> = {
  STABLE: "stable",
  GROWING: "up",
  DECREASING: "down",
};
const phenStatusMap: Record<PhenomenonStatus, ProjectPhenomenon["status"]> = {
  OBSERVED: "Em observação",
  IN_ANALYSIS: "Atenção",
  CONSOLIDATED: "Consolidado",
};
const phenImpactLabel: Record<SvcPhenomenon["impact"], string> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};

function toProjectPhenomenon(p: SvcPhenomenon): ProjectPhenomenon {
  return {
    id: p.id,
    title: p.name,
    evidence: `${p.evidenceCount} ${p.evidenceCount === 1 ? "evidência registrada" : "evidências registradas"}`,
    impact: phenImpactLabel[p.impact],
    trend: trendMap[p.trend],
    status: phenStatusMap[p.status],
  };
}

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus } as const;

function SectionTitle({
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
        <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const toneClass: Record<string, string> = {
  warning: "text-warning",
  success: "text-success",
  danger: "text-destructive",
  info: "text-info",
  default: "text-foreground",
};

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const [project, setProject] = useState<LegacyProject | null>(null);
  const [rawProject, setRawProject] = useState<SvcProject | null>(null);
  const [domain, setDomain] = useState<SvcDomain | null>(null);
  const [svcPhenomena, setSvcPhenomena] = useState<ProjectPhenomenon[]>([]);
  const [rawPhenomena, setRawPhenomena] = useState<SvcPhenomenon[]>([]);
  const [svcObservations, setSvcObservations] = useState<ProjectObservation[]>([]);
  const [rawObservations, setRawObservations] = useState<SvcObservation[]>([]);
  const [attrNameById, setAttrNameById] = useState<Map<string, string>>(new Map());
  const [phenNameById, setPhenNameById] = useState<Map<string, string>>(new Map());
  const [discussionsRefresh, setDiscussionsRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("observacoes");
  const [coverage, setCoverage] = useState<ProjectCoverage | null>(null);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProjectById(id),
      getDomains(),
      getPhenomenaByProject(id),
      getObservationsByProject(id),
      getMpoAttributes(),
      getProjectCoverage(id),
      getFeed({ projectId: id }).catch(() => [] as FeedEvent[]),
    ])
      .then(([p, ds, phs, observs, attrs, cov, fe]) => {
        if (cancelled) return;
        if (!p) {
          setProject(null);
          setLoading(false);
          return;
        }
        setCoverage(cov);
        setFeedEvents(fe);
        const domainsById = new Map(ds.map((d) => [d.id, d] as const));
        setDomain(domainsById.get(p.domainId) ?? null);
        setRawProject(p);
        setProject(toLegacyProject(p, domainsById));
        setRawPhenomena(phs);
        setSvcPhenomena(phs.map(toProjectPhenomenon));
        const attrMap = new Map(attrs.map((a) => [a.id, a.name] as const));
        const phenMap = new Map(phs.map((ph) => [ph.id, ph.name] as const));
        setAttrNameById(attrMap);
        setPhenNameById(phenMap);
        setRawObservations(observs);
        setSvcObservations(observs.map((o) => toProjectObservation(o, attrMap, phenMap)));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProject(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // MPO coverage is the consultant's measurement instrument — hidden from clients.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    getCurrentUser().then((user) => setIsClient(user?.profileCode === "CLIENT"));
  }, []);

  // Discussions/knowledge are fetched at page level so the funnel and the
  // Comunidade tab share the same data.
  const [projectDiscussions, setProjectDiscussions] = useState<
    ReturnType<typeof toCommunityDiscussion>[]
  >([]);
  const [rawDiscussions, setRawDiscussions] = useState<SvcDiscussion[]>([]);
  const [projectKnowledge, setProjectKnowledge] = useState<CommunityKnowledge[]>([]);

  useEffect(() => {
    let cancelled = false;
    const domainName = domain?.name ?? "—";
    const projectName = rawProject?.name ?? "";
    getDiscussionsByProject(id).then((discussions) => {
      if (cancelled) return;
      setRawDiscussions(discussions);
      setProjectDiscussions(
        discussions.map((d) =>
          toCommunityDiscussion(d, {
            domain: domainName,
            project: projectName,
            phenomenon: d.phenomenonId ? (phenNameById.get(d.phenomenonId) ?? d.phenomenonId) : "—",
            originObservation: d.observationId ? `Observação #${d.observationId}` : undefined,
          }),
        ),
      );
    });
    getKnowledgeByProject(id)
      .then((knowledge) => {
        if (cancelled) return;
        setProjectKnowledge(
          knowledge.map((k) =>
            toCommunityKnowledge(k, {
              domain: domainName,
              project: projectName,
              phenomenon: k.phenomenonId
                ? (phenNameById.get(k.phenomenonId) ?? k.phenomenonId)
                : undefined,
            }),
          ),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, domain, rawProject, phenNameById, discussionsRefresh]);

  // Coverage depends on which attributes are observed — refresh it whenever
  // observations change (manual record or accepted AI suggestion). `loading`
  // is read but intentionally not a dependency: the initial load already
  // fetched coverage, so the loading→false transition must not refetch.
  useEffect(() => {
    if (loading) return;
    getProjectCoverage(id).then(setCoverage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rawObservations.length]);

  const displayTimeline = useMemo(
    () =>
      feedEvents.map((e) => ({
        id: `${e.kind}-${e.id}`,
        type: e.kind,
        description: e.title,
        actor: e.actorName ?? "Observatório",
        date: e.createdAt,
      })),
    [feedEvents],
  );

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Carregando projeto…" />
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="px-6 py-10 md:px-10">
          <h1 className="text-lg font-semibold">Projeto não encontrado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Este projeto não está disponível no observatório.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/">Voltar ao observatório</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const phenomenaList: ProjectPhenomenon[] = svcPhenomena;
  const observationsList: ProjectObservation[] = svcObservations;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AppShell>
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="px-6 pt-5 md:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Observatório
          </Link>
        </div>
        <div className="flex flex-col gap-5 px-6 py-5 md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground">
                <span className="font-mono uppercase tracking-wider">Projeto observado</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="uppercase tracking-wider">{project.model}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <StatusBadge status={project.status} />
              </div>
              <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-foreground">
                {project.name}
              </h1>
              <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">{project.summary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {domain?.slug && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/community/$slug" params={{ slug: domain.slug }}>
                    Ver comunidade <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
              {!isClient && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link to="/projects/$id/edit" params={{ id }}>
                    <PenSquare className="h-3.5 w-3.5" /> Editar projeto
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Overview + indicadores (sintetizados) */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-6">
              <MetaItem label="Comunidade" value={domain?.name ?? project.domain} />
              <MetaItem label="Tipo" value={project.model} />
              <MetaItem label="Consultor" value={project.owner} />
              <MetaItem label="Cliente" value={project.clientName ?? "—"} />
              <MetaItem
                label="Início"
                value={rawProject?.startDate ? formatDate(rawProject.startDate) : "—"}
              />
              <MetaItem
                label="Previsão"
                value={rawProject?.expectedEndDate ? formatDate(rawProject.expectedEndDate) : "—"}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                Risco
                <span
                  className={cn(
                    "font-medium",
                    rawProject && toneClass[riskLevelTone(rawProject.riskLevel)],
                  )}
                >
                  {rawProject ? riskCodeToLabel[rawProject.riskLevel] : "—"}
                </span>
              </span>
              {!isClient && coverage && (
                <span className="inline-flex items-center gap-1.5">
                  Cobertura da observação
                  <span className="font-medium text-foreground">{coverage.percentage}%</span>
                </span>
              )}
              {!isClient && (
                <span className="inline-flex items-center gap-1.5">
                  Aceitas da IA
                  <span className="font-medium text-foreground">
                    {rawObservations.filter((o) => o.origin === "AI_SUGGESTED").length}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 md:px-10">
        {/* Funil do observatório: observar → discutir → aprender */}
        <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-2.5">
          <FunnelStage
            count={rawObservations.length}
            label="observações"
            active={activeTab === "observacoes"}
            onClick={() => setActiveTab("observacoes")}
          />
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <FunnelStage
            count={projectDiscussions.length}
            label="conversas"
            active={activeTab === "observacoes"}
            onClick={() => setActiveTab("observacoes")}
          />
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <FunnelStage
            count={projectKnowledge.length}
            label="aprendizados"
            active={activeTab === "aprendizados"}
            onClick={() => setActiveTab("aprendizados")}
          />
          <div className="ml-auto">
            <FunnelStage
              count={rawPhenomena.length}
              label="fenômenos"
              active={activeTab === "fenomenos"}
              onClick={() => setActiveTab("fenomenos")}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="observacoes">Observações</TabsTrigger>
            <TabsTrigger value="fenomenos">Fenômenos</TabsTrigger>
            <TabsTrigger value="aprendizados">Aprendizados</TabsTrigger>
            <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          </TabsList>
          <TabsContent value="observacoes" className="mt-6">
            {/* Artefatos */}
            <ManualObservationSection
              projectId={id}
              domainId={project.domainId}
              isClient={isClient}
              initial={observationsList}
              rawObservations={rawObservations}
              discussions={rawDiscussions}
              phenomena={rawPhenomena}
              attrNameById={attrNameById}
              phenNameById={phenNameById}
              onObservationsChange={(observs) => {
                setRawObservations(observs);
                setSvcObservations(
                  observs.map((o) => toProjectObservation(o, attrNameById, phenNameById)),
                );
              }}
              onDiscussionCreated={() => setDiscussionsRefresh((k) => k + 1)}
            />
          </TabsContent>
          <TabsContent value="fenomenos" className="mt-6">
            {/* Fenômenos */}
            <section>
              <SectionTitle
                eyebrow="Padrões e comportamentos"
                title="Fenômenos Associados"
                description="Sinais identificados a partir do cruzamento dos atributos observados."
              />
              {phenomenaList.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
                  Nenhum fenômeno em acompanhamento ainda — fenômenos surgem do cruzamento das
                  observações registradas neste projeto.
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {phenomenaList.map((ph) => {
                  const TrendIcon = trendIcon[ph.trend];
                  return (
                    <article key={ph.id} className="rounded-xl border border-border bg-card p-5">
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
                      <h3 className="mt-2 text-[14px] font-semibold leading-snug text-foreground">
                        {ph.title}
                      </h3>
                      <dl className="mt-3 space-y-1.5 text-[12.5px]">
                        <DefRow label="Evidências" value={ph.evidence} />
                        <DefRow label="Impacto" value={ph.impact} />
                        <DefRow
                          label="Tendência"
                          value={
                            ph.trend === "up"
                              ? "Crescente"
                              : ph.trend === "down"
                                ? "Decrescente"
                                : "Estável"
                          }
                        />
                        <DefRow label="Status" value={ph.status} />
                      </dl>
                    </article>
                  );
                })}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="aprendizados" className="mt-6">
            <ProjectDiscussionsAndKnowledge
              projectKnowledge={projectKnowledge}
              domainSlug={domain?.slug}
            />
          </TabsContent>
          <TabsContent value="timeline" className="mt-6">
            {/* Timeline */}
            <section>
              <SectionTitle
                eyebrow="Evolução observacional"
                title="Linha do Tempo Observacional"
                description="O observatório acompanha a evolução do projeto ao longo do tempo."
              />
              {displayTimeline.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
                  Ainda não há eventos registrados — observações, discussões e conhecimentos deste
                  projeto aparecerão aqui conforme forem criados.
                </div>
              )}
              <ol className="mt-4 space-y-2">
                {displayTimeline.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-foreground">
                      <TimelineIcon type={ev.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] leading-relaxed text-foreground">
                        {ev.description}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="capitalize">{ev.type}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{ev.actor}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="font-mono">{formatDate(ev.date)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function ObservationThread({
  discussion,
  currentUserId,
  onChanged,
}: {
  discussion: SvcDiscussion;
  currentUserId: string;
  onChanged: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    const created = await addContribution(discussion.id, {
      userId: currentUserId,
      type: "INTERPRETATION",
      text: value,
    });
    setSending(false);
    if (!created) {
      toast.error("Não foi possível enviar o comentário.");
      return;
    }
    setText("");
    onChanged();
  };

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        Conversa · {discussion.contributions.length} comentário
        {discussion.contributions.length === 1 ? "" : "s"}
      </div>
      {discussion.question && (
        <p className="mt-2 text-[12.5px] italic text-muted-foreground">“{discussion.question}”</p>
      )}
      <ul className="mt-2 space-y-2">
        {discussion.contributions.map((c) => (
          <li key={c.id} className="rounded-md bg-background p-2.5">
            <p className="text-[12.5px] leading-relaxed text-foreground">{c.text}</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              {c.userName ?? "Participante"}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Contribua com a conversa…"
          className="h-8 flex-1 text-[12.5px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button
          size="sm"
          className="h-8 text-[12px]"
          disabled={sending || !text.trim()}
          onClick={send}
        >
          {sending ? "Enviando…" : "Comentar"}
        </Button>
      </div>
    </div>
  );
}

function FunnelStage({
  count,
  label,
  active,
  onClick,
}: {
  count: number;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors hover:bg-muted/60",
        active && "bg-muted/60",
        count === 0 ? "text-muted-foreground" : "text-foreground",
      )}
    >
      <span className={cn("text-[15px] font-semibold tabular-nums", count === 0 && "font-normal")}>
        {count}
      </span>
      {label}
    </button>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-foreground">{value}</p>
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

function AttrBlock({
  title,
  description,
  items,
  highlight,
}: {
  title: string;
  description: string;
  items: { label: string; value: string; className?: string }[];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        highlight ? "border-foreground/20 bg-foreground/[0.025]" : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Layers className="h-3 w-3" /> {title}
      </div>
      <p className="mt-1 text-[11.5px] text-muted-foreground">{description}</p>
      <dl className="mt-3 space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline justify-between gap-3 text-[12.5px]">
            <dt className="text-muted-foreground">{it.label}</dt>
            <dd className={cn("text-right font-medium text-foreground", it.className)}>
              {it.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TimelineIcon({ type }: { type: string }) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    observation: ClipboardList,
    discussion: MessageSquare,
    knowledge: BookOpen,
  };
  const Icon = map[type] ?? Eye;
  return <Icon className="h-3.5 w-3.5" />;
}

/* --------------------- Manual observation section ------------------------ */

const observationStatusTone: Record<string, string> = {
  registrada: "border-border text-muted-foreground bg-muted/40",
  "em análise": "border-warning/30 text-warning bg-warning/5",
  "associada a discussão": "border-info/30 text-info bg-info/5",
  consolidada: "border-success/30 text-success bg-success/5",
};

const impactTone: Record<string, string> = {
  Baixo: "text-muted-foreground",
  Médio: "text-info",
  Alto: "text-warning",
};

const riskTone: Record<string, string> = {
  Baixo: "text-muted-foreground",
  Moderado: "text-info",
  Elevado: "text-warning",
  Crítico: "text-destructive",
};

const impactToCode: Record<ProjectObservation["impact"], SvcObsImpact> = {
  Baixo: "LOW",
  Médio: "MEDIUM",
  Alto: "HIGH",
};

const riskToCode: Record<ProjectObservation["risk"], SvcObsRisk> = {
  Baixo: "LOW",
  Moderado: "MODERATE",
  Elevado: "HIGH",
  Crítico: "CRITICAL",
};

const DISCUSSION_VISIBILITY: VisibilityScope[] = [
  "Comunidade do domínio",
  "Participantes do projeto",
  "Consultores vinculados",
  "Administradores",
];

const DISCUSSION_STATUS: DiscussionStatus[] = [
  "Aberta",
  "Em análise",
  "Revisada",
  "Consolidada",
  "Arquivada",
];

function ManualObservationSection({
  projectId,
  domainId,
  isClient,
  initial,
  rawObservations,
  discussions,
  phenomena,
  attrNameById,
  phenNameById,
  onObservationsChange,
  onDiscussionCreated,
}: {
  projectId: string;
  domainId: string;
  isClient: boolean;
  initial: ProjectObservation[];
  rawObservations: SvcObservation[];
  discussions: SvcDiscussion[];
  phenomena: SvcPhenomenon[];
  attrNameById: Map<string, string>;
  phenNameById: Map<string, string>;
  onObservationsChange: (observs: SvcObservation[]) => void;
  onDiscussionCreated: () => void;
}) {
  const [items, setItems] = useState<ProjectObservation[]>(initial);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<ObservationSuggestion[]>([]);
  const [aiSuggestionId, setAiSuggestionId] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discussionObsId, setDiscussionObsId] = useState<string | null>(null);
  const [discussionSubmitting, setDiscussionSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    attribute: "",
    phenomenon: "",
    customPhenomenon: "",
    impact: "Médio" as ProjectObservation["impact"],
    risk: "Moderado" as ProjectObservation["risk"],
    interpretation: "",
    author: "Você",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    attribute: "",
    phenomenon: "",
    customPhenomenon: "",
    impact: "Médio" as ProjectObservation["impact"],
    risk: "Moderado" as ProjectObservation["risk"],
    interpretation: "",
  });
  const [discussionForm, setDiscussionForm] = useState({
    title: "",
    question: "",
    visibility: "Participantes do projeto" as VisibilityScope,
    status: "Aberta" as DiscussionStatus,
  });

  const [mpoCategories, setMpoCategories] = useState<MpoCategory[]>([]);
  useEffect(() => {
    getMpoCategories().then(setMpoCategories);
  }, []);

  // Options come from the project's own phenomena (the hypotheses declared at
  // creation) so manual evidence lands on them; "Outro" allows naming a new one.
  const phenomenonOptions = useMemo(() => {
    const names = phenomena.map((p) => p.name);
    if (!names.includes("Outro")) names.push("Outro");
    return names;
  }, [phenomena]);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) return;
      setCurrentUserId(user.id);
      setForm((f) => ({ ...f, author: user.name }));
    });
  }, []);

  const resolvePhenomenonId = (select: string, custom: string) => {
    if (!select) return undefined;
    if (select === "Outro") return custom.trim() || undefined;
    const byName = phenomena.find((p) => p.name === select);
    if (byName) return byName.id;
    const byId = phenomena.find((p) => p.id === select);
    if (byId) return byId.id;
    return undefined;
  };

  const resolvePhenomenonIdFromRaw = (raw?: SvcObservation) => {
    if (!raw?.phenomenonId) return undefined;
    if (phenNameById.has(raw.phenomenonId)) return raw.phenomenonId;
    const byName = phenomena.find((p) => p.name === raw.phenomenonId);
    return byName?.id ?? (/^\d+$/.test(raw.phenomenonId) ? raw.phenomenonId : undefined);
  };

  const applyObservationUpdate = (updated: SvcObservation) => {
    const display = toProjectObservation(updated, attrNameById, phenNameById);
    setItems((prev) => prev.map((o) => (o.id === updated.id ? display : o)));
    onObservationsChange(rawObservations.map((o) => (o.id === updated.id ? updated : o)));
  };

  const prependObservation = (created: SvcObservation) => {
    setItems((prev) => [toProjectObservation(created, attrNameById, phenNameById), ...prev]);
    onObservationsChange([created, ...rawObservations]);
  };

  const handleSuggestObservations = async () => {
    setAiLoading(true);
    try {
      const res = await suggestObservations(projectId);
      setAiSuggestions(res.suggestions);
      setAiSuggestionId(res.suggestionId);
      if (res.suggestions.length === 0) toast.info("A IA não sugeriu observações.");
    } catch {
      toast.error("Não foi possível obter sugestões da IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptSuggestion = async (s: ObservationSuggestion) => {
    try {
      const impact = (
        ["LOW", "MEDIUM", "HIGH"].includes(s.impact) ? s.impact : "MEDIUM"
      ) as SvcObsImpact;
      const created = await createObservation(projectId, {
        title: s.title,
        description: s.description,
        attributeId: s.attributeId,
        impact,
        risk: "MODERATE" as SvcObsRisk,
        interpretation: "",
        status: "REGISTERED",
        origin: "AI_SUGGESTED",
        sourceExcerpt: s.sourceExcerpt || undefined,
        suggestionId: aiSuggestionId ?? undefined,
        createdBy: currentUserId,
      });
      prependObservation(created);
      setAiSuggestions((prev) => prev.filter((x) => x !== s));
      toast.success("Observação criada a partir da sugestão da IA.");
    } catch {
      toast.error("Não foi possível criar a observação.");
    }
  };

  const isCustomPhenomenon = form.phenomenon === "Outro";
  const isEditCustomPhenomenon = editForm.phenomenon === "Outro";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || submitting) return;
    if (isCustomPhenomenon && !form.customPhenomenon.trim()) return;

    setSubmitting(true);
    try {
      const created = await createObservation(projectId, {
        title: form.title.trim(),
        description: form.description.trim(),
        attributeId: form.attribute,
        phenomenonId: resolvePhenomenonId(form.phenomenon, form.customPhenomenon),
        impact: impactToCode[form.impact],
        risk: riskToCode[form.risk],
        interpretation: form.interpretation.trim(),
        status: "REGISTERED",
        createdBy: currentUserId,
      });

      prependObservation(created);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        setForm((f) => ({
          ...f,
          title: "",
          description: "",
          interpretation: "",
          phenomenon: "",
          customPhenomenon: "",
        }));
      }, 1400);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (observationId: string) => {
    const raw = rawObservations.find((o) => o.id === observationId);
    if (!raw) return;

    const phenLabel = raw.phenomenonId
      ? (phenNameById.get(raw.phenomenonId) ?? raw.phenomenonId)
      : "";
    const matchedPhen = phenomena.find(
      (p) => p.id === raw.phenomenonId || p.name === raw.phenomenonId,
    );
    const phenSelect = matchedPhen
      ? matchedPhen.name
      : !phenLabel || phenomenonOptions.includes(phenLabel)
        ? phenLabel
        : "Outro";

    setEditForm({
      title: raw.title,
      description: raw.description,
      attribute: raw.attributeId ?? "",
      phenomenon: phenSelect,
      customPhenomenon: phenSelect === "Outro" ? (raw.phenomenonId ?? "") : "",
      impact: obsImpactMap[raw.impact],
      risk: obsRiskMap[raw.risk],
      interpretation: raw.interpretation ?? "",
    });
    setEditingId(observationId);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.title.trim() || !editForm.description.trim() || editSubmitting) {
      return;
    }
    if (isEditCustomPhenomenon && !editForm.customPhenomenon.trim()) return;

    setEditSubmitting(true);
    try {
      const updated = await updateObservation(editingId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        attributeId: editForm.attribute,
        phenomenonId: resolvePhenomenonId(editForm.phenomenon, editForm.customPhenomenon),
        impact: impactToCode[editForm.impact],
        risk: riskToCode[editForm.risk],
        interpretation: editForm.interpretation.trim(),
      });

      if (!updated) {
        toast.error("Não foi possível atualizar a observação.");
        return;
      }

      applyObservationUpdate(updated);
      toast.success("Observação atualizada com sucesso.");
      setEditOpen(false);
      setEditingId(null);
    } finally {
      setEditSubmitting(false);
    }
  };

  const openDiscussion = (observationId: string) => {
    const raw = rawObservations.find((o) => o.id === observationId);
    const display = items.find((o) => o.id === observationId);
    setDiscussionForm({
      title: `Discussão sobre: ${display?.title ?? raw?.title ?? "observação"}`,
      question: "Como esta observação impacta os fenômenos do projeto?",
      visibility: "Participantes do projeto",
      status: "Aberta",
    });
    setDiscussionObsId(observationId);
    setDiscussionOpen(true);
  };

  const handleDiscussionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionObsId || !discussionForm.title.trim() || !discussionForm.question.trim()) {
      return;
    }
    if (discussionSubmitting) return;

    const raw = rawObservations.find((o) => o.id === discussionObsId);

    setDiscussionSubmitting(true);
    try {
      const created = await createDiscussion({
        title: discussionForm.title.trim(),
        question: discussionForm.question.trim(),
        domainId,
        projectId,
        observationId: discussionObsId,
        phenomenonId: resolvePhenomenonIdFromRaw(raw),
        status: statusCodes[discussionForm.status],
        visibility: visibilityCodes[discussionForm.visibility],
        createdBy: currentUserId,
      });

      const linked = await linkObservationToDiscussion(discussionObsId, created.id);
      if (linked) applyObservationUpdate(linked);

      onDiscussionCreated();
      toast.success("Discussão observacional criada com sucesso.");
      setDiscussionOpen(false);
      setDiscussionObsId(null);
    } catch {
      toast.error("Não foi possível criar a discussão.");
    } finally {
      setDiscussionSubmitting(false);
    }
  };

  const handleMarkAnalyzed = async (observationId: string) => {
    setAnalyzingId(observationId);
    try {
      const updated = await markObservationAsAnalyzed(observationId);
      if (!updated) {
        toast.error("Não foi possível marcar a observação como analisada.");
        return;
      }
      applyObservationUpdate(updated);
      toast.success("Observação marcada como analisada.");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <section>
      <SectionTitle
        eyebrow="Evidências do projeto"
        title="Observações"
        description="O que o observatório registrou neste projeto, manualmente ou aceitando sugestões da IA."
        action={
          isClient ? undefined : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleSuggestObservations}
                disabled={aiLoading}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? "Sugerindo…" : "Sugerir observações (IA)"}
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Nova observação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                  <DialogHeader>
                    <DialogTitle>Registrar nova observação</DialogTitle>
                    <DialogDescription>
                      Registre uma evidência observada no projeto: descrição, atributo afetado,
                      fenômeno associado e sua interpretação inicial.
                    </DialogDescription>
                  </DialogHeader>
                  {success ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                      <p className="text-sm font-medium">Observação registrada com sucesso.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="obs-title">Título da observação</Label>
                        <Input
                          id="obs-title"
                          placeholder="Ex.: Cliente solicitou nova alteração de escopo após aprovação inicial"
                          value={form.title}
                          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="obs-date">Data da observação</Label>
                          <Input
                            id="obs-date"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="obs-author">Responsável pelo registro</Label>
                          <Input
                            id="obs-author"
                            value={form.author}
                            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="obs-desc">Descrição da evidência</Label>
                        <Textarea
                          id="obs-desc"
                          rows={3}
                          placeholder="Descreva o que aconteceu, qual evidência foi observada e por que isso é relevante para o projeto."
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Atributo relacionado</Label>
                          <Select
                            value={form.attribute}
                            onValueChange={(v) => setForm((f) => ({ ...f, attribute: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um aspecto do projeto" />
                            </SelectTrigger>
                            <SelectContent>
                              {mpoCategories.map((cat) => (
                                <SelectGroup key={cat.key}>
                                  <SelectLabel>{cat.label}</SelectLabel>
                                  {cat.attributes
                                    .filter((a) => a.type !== "fora_de_escopo")
                                    .map((a) => (
                                      <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                      </SelectItem>
                                    ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Fenômeno observado</Label>
                          <Select
                            value={form.phenomenon}
                            onValueChange={(v) => setForm((f) => ({ ...f, phenomenon: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Nenhum (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {phenomenonOptions.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isCustomPhenomenon && (
                            <Input
                              className="mt-2"
                              placeholder="Nomear novo fenômeno observado"
                              value={form.customPhenomenon}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, customPhenomenon: e.target.value }))
                              }
                            />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Impacto</Label>
                          <Select
                            value={form.impact}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, impact: v as ProjectObservation["impact"] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["Baixo", "Médio", "Alto"].map((v) => (
                                <SelectItem key={v} value={v}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Risco</Label>
                          <Select
                            value={form.risk}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, risk: v as ProjectObservation["risk"] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["Baixo", "Moderado", "Elevado", "Crítico"].map((v) => (
                                <SelectItem key={v} value={v}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="obs-interp">Interpretação inicial</Label>
                        <Textarea
                          id="obs-interp"
                          rows={2}
                          placeholder="Descreva a interpretação inicial sobre essa observação."
                          value={form.interpretation}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, interpretation: e.target.value }))
                          }
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" size="sm" disabled={submitting}>
                          {submitting ? "Registrando…" : "Registrar observação"}
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )
        }
      />

      {aiSuggestions.length > 0 && (
        <div className="mt-4 space-y-2 rounded-xl border border-dashed border-foreground/30 bg-foreground/[0.02] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Sugestões da IA · revise antes de aceitar
          </p>
          {aiSuggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium">{s.title}</p>
                <p className="text-[12px] text-muted-foreground">{s.description}</p>
                {s.sourceExcerpt && (
                  <p className="mt-1 border-l-2 border-border pl-2 text-[11px] italic text-muted-foreground">
                    “{s.sourceExcerpt}”
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  atributo: {attrNameById.get(s.attributeId) ?? s.attributeId} · impacto:{" "}
                  {obsImpactMap[s.impact as SvcObsImpact] ?? "Médio"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAiSuggestions((p) => p.filter((x) => x !== s))}
                >
                  Descartar
                </Button>
                <Button size="sm" onClick={() => acceptSuggestion(s)}>
                  Aceitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
          Nenhuma observação registrada ainda. Registre a primeira manualmente ou peça sugestões à
          IA. É a partir das observações que o observatório mede a cobertura.
        </div>
      )}
      <div className="mt-4 space-y-3">
        {items.map((o) => (
          <article key={o.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  {o.aiSuggested ? (
                    <>
                      <Sparkles className="h-3 w-3" /> Sugerida pela IA · aceita
                    </>
                  ) : (
                    <>
                      <ClipboardList className="h-3 w-3" /> Observação manual
                    </>
                  )}
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="font-mono">{o.date}</span>
                </div>
                <h3 className="mt-1.5 text-[14px] font-semibold leading-snug text-foreground">
                  {o.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {o.description}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                  observationStatusTone[o.status],
                )}
              >
                {o.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 md:grid-cols-4">
              <Meta label="Atributo" value={o.attribute} />
              <Meta label="Fenômeno" value={o.phenomenon} />
              <Meta label="Impacto" value={o.impact} className={impactTone[o.impact]} />
              <Meta label="Risco" value={o.risk} className={riskTone[o.risk]} />
            </div>

            {o.interpretation && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/70" />
                <p className="text-[12.5px] leading-relaxed text-foreground/90">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Interpretação ·{" "}
                  </span>
                  {o.interpretation}
                </p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>por {o.author}</span>
              {!isClient && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-[11px]"
                    onClick={() => openEdit(o.id)}
                  >
                    <PenSquare className="h-3 w-3" /> Editar
                  </Button>
                  {!discussions.some((d) => d.observationId === o.id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-[11px]"
                      onClick={() => openDiscussion(o.id)}
                    >
                      <MessageSquare className="h-3 w-3" /> Iniciar conversa
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-[11px]"
                    disabled={analyzingId === o.id || o.status === "em análise"}
                    onClick={() => handleMarkAnalyzed(o.id)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {analyzingId === o.id ? "Atualizando…" : "Marcar como analisada"}
                  </Button>
                </div>
              )}
            </div>

            {discussions
              .filter((d) => d.observationId === o.id)
              .map((d) => (
                <ObservationThread
                  key={d.id}
                  discussion={d}
                  currentUserId={currentUserId}
                  onChanged={onDiscussionCreated}
                />
              ))}
          </article>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Editar observação</DialogTitle>
            <DialogDescription>
              Atualize os dados da evidência observada neste projeto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs-title">Título da observação</Label>
              <Input
                id="edit-obs-title"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs-desc">Descrição da evidência</Label>
              <Textarea
                id="edit-obs-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Atributo relacionado</Label>
                <Select
                  value={editForm.attribute}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, attribute: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aspecto do projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {mpoCategories.map((cat) => (
                      <SelectGroup key={cat.key}>
                        <SelectLabel>{cat.label}</SelectLabel>
                        {cat.attributes
                          .filter((a) => a.type !== "fora_de_escopo")
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fenômeno observado</Label>
                <Select
                  value={editForm.phenomenon}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, phenomenon: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {phenomenonOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditCustomPhenomenon && (
                  <Input
                    className="mt-2"
                    placeholder="Nomear fenômeno observado"
                    value={editForm.customPhenomenon}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, customPhenomenon: e.target.value }))
                    }
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Impacto</Label>
                <Select
                  value={editForm.impact}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, impact: v as ProjectObservation["impact"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Baixo", "Médio", "Alto"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Risco</Label>
                <Select
                  value={editForm.risk}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, risk: v as ProjectObservation["risk"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Baixo", "Moderado", "Elevado", "Crítico"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs-interp">Interpretação inicial</Label>
              <Textarea
                id="edit-obs-interp"
                rows={2}
                value={editForm.interpretation}
                onChange={(e) => setEditForm((f) => ({ ...f, interpretation: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" size="sm" disabled={editSubmitting}>
                {editSubmitting ? "Salvando…" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={discussionOpen} onOpenChange={setDiscussionOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Iniciar conversa</DialogTitle>
            <DialogDescription>
              Comece uma conversa a partir desta observação registrada no projeto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDiscussionSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dis-title">Título da conversa</Label>
              <Input
                id="dis-title"
                value={discussionForm.title}
                onChange={(e) => setDiscussionForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dis-question">Pergunta investigativa</Label>
              <Textarea
                id="dis-question"
                rows={3}
                value={discussionForm.question}
                onChange={(e) => setDiscussionForm((f) => ({ ...f, question: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Visibilidade</Label>
                <Select
                  value={discussionForm.visibility}
                  onValueChange={(v) =>
                    setDiscussionForm((f) => ({ ...f, visibility: v as VisibilityScope }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCUSSION_VISIBILITY.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={discussionForm.status}
                  onValueChange={(v) =>
                    setDiscussionForm((f) => ({ ...f, status: v as DiscussionStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCUSSION_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" size="sm" disabled={discussionSubmitting}>
                {discussionSubmitting ? "Iniciando…" : "Iniciar conversa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Meta({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-[12.5px] font-medium text-foreground", className)}>{value}</p>
    </div>
  );
}

/* --------------------------- Aprendizados do Projeto ----------------------- */

function ProjectDiscussionsAndKnowledge({
  projectKnowledge,
  domainSlug,
}: {
  projectKnowledge: CommunityKnowledge[];
  domainSlug?: string;
}) {
  const communityLink = domainSlug ? (
    <Link to="/community/$slug" params={{ slug: domainSlug }}>
      Ir para a comunidade <ArrowRight className="h-3 w-3" />
    </Link>
  ) : (
    <Link to="/community">
      Ir para a comunidade <ArrowRight className="h-3 w-3" />
    </Link>
  );

  if (projectKnowledge.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
        Nenhum aprendizado consolidado ainda. Quando as conversas das observações amadurecem, o
        consultor as consolida na comunidade e o resultado aparece aqui.
      </div>
    );
  }

  return (
    <section>
      <SectionTitle
        eyebrow="O que este projeto ensinou"
        title="Aprendizados do projeto"
        description="Consolidações que nasceram das conversas sobre as observações."
        action={
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            {communityLink}
          </Button>
        }
      />
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {projectKnowledge.map((k) => (
          <article key={k.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-3 w-3" /> {k.phenomenon}
              </div>
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {k.status}
              </span>
            </div>
            <h3 className="mt-2 text-[14.5px] font-semibold leading-snug text-foreground">
              {k.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{k.summary}</p>
            <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 text-[12px] text-foreground">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                recomendação ·{" "}
              </span>
              {k.recommendation}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Confiança: <span className="font-medium text-foreground">{k.confidence}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
