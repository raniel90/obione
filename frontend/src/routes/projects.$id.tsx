import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
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
import { toast } from "sonner";
import { getProjectById } from "@/services/projectService";
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
import { getMpoAttributes, getMpoCategories } from "@/services/mpoAttributeService";
import type { MpoCategory } from "@/types/mpoAttribute";
import { type DiscussionStatus, type VisibilityScope } from "@/lib/community-data";
import {
  getKnowledgeByProject,
  getKnowledgeByDomain,
  toCommunityKnowledge,
} from "@/services/knowledgeService";
import type { CommunityKnowledge } from "@/lib/community-data";
import type { Knowledge } from "@/types/knowledge";
import { synthesizeDomain } from "@/services/aiService";
import type { DomainSynthesis } from "@/services/aiService";
import { KnowledgeCard } from "@/components/community-pieces";
import { BookOpen } from "lucide-react";
import type { ProjectObservation } from "@/lib/project-observatory";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Plus,
  PenSquare,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { relativeTime } from "@/components/feed-event-item";
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

type ProjectTab = "observacoes" | "aprendizados" | "timeline";

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
  // Deep-link to a tab (e.g. the feed sends a conversa to ?tab=observacoes).
  // Optional so existing links to the project don't need to pass search.
  validateSearch: (search: Record<string, unknown>): { tab?: ProjectTab } => {
    const tab = search.tab;
    return tab === "aprendizados" || tab === "timeline" || tab === "observacoes" ? { tab } : {};
  },
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

function toProjectObservation(o: SvcObservation, attrMap: Map<string, string>): ProjectObservation {
  return {
    id: o.id,
    title: o.title,
    date: o.createdAt,
    description: o.description,
    attribute: attrMap.get(o.attributeId) ?? o.attributeId ?? "—",
    impact: obsImpactMap[o.impact],
    risk: obsRiskMap[o.risk],
    interpretation: o.interpretation,
    author: o.createdByName ?? authorIdLabel(o.createdBy),
    status: obsStatusMap[o.status],
    aiSuggested: o.origin === "AI_SUGGESTED",
    sourceExcerpt: o.sourceExcerpt,
  };
}

type TimelineItem = {
  key: string;
  kind: string;
  title: string;
  actor: string;
  date: string;
  observationId?: string;
};

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
  const [svcObservations, setSvcObservations] = useState<ProjectObservation[]>([]);
  const [rawObservations, setRawObservations] = useState<SvcObservation[]>([]);
  const [attrNameById, setAttrNameById] = useState<Map<string, string>>(new Map());
  const [discussionsRefresh, setDiscussionsRefresh] = useState(0);
  const { tab: initialTab } = Route.useSearch();
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? "observacoes");
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProjectById(id),
      getDomains(),
      getObservationsByProject(id),
      getMpoAttributes(),
      getFeed({ projectId: id }).catch(() => [] as FeedEvent[]),
    ])
      .then(([p, ds, observs, attrs, fe]) => {
        if (cancelled) return;
        if (!p) {
          setProject(null);
          setLoading(false);
          return;
        }
        setFeedEvents(fe);
        const domainsById = new Map(ds.map((d) => [d.id, d] as const));
        setDomain(domainsById.get(p.domainId) ?? null);
        setRawProject(p);
        setProject(toLegacyProject(p, domainsById));
        const attrMap = new Map(attrs.map((a) => [a.id, a.name] as const));
        setAttrNameById(attrMap);
        setRawObservations(observs);
        setSvcObservations(observs.map((o) => toProjectObservation(o, attrMap)));
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
  const { isClient } = useCurrentUser();

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
            }),
          ),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, domain, rawProject, discussionsRefresh]);

  // Timeline events enriched for navigation: a conversa resolves to the
  // observation it came from, so clicking it reaches the thread.
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const obsByDiscussion = new Map(
      rawDiscussions.map((d) => [
        String(d.id),
        d.observationId ? String(d.observationId) : undefined,
      ]),
    );
    return feedEvents.map((e) => ({
      key: `${e.kind}-${e.id}`,
      kind: e.kind,
      title: e.title,
      actor: e.actorName ?? "Observatório",
      date: e.createdAt,
      observationId:
        e.kind === "observation"
          ? String(e.id)
          : e.kind === "discussion"
            ? obsByDiscussion.get(String(e.id))
            : undefined,
    }));
  }, [feedEvents, rawDiscussions]);

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

  const observationsList: ProjectObservation[] = svcObservations;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  // Switch to the Observações tab and bring a specific observation into view
  // (used by the timeline so conversations are reachable).
  const openObservation = (observationId?: string) => {
    setActiveTab("observacoes");
    if (!observationId) return;
    setTimeout(() => {
      document
        .getElementById(`obs-${observationId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

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
              <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                {project.summary}
              </p>
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
                label="Conclusão"
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
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 md:px-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="observacoes">
              Observações
              <TabCount n={rawObservations.length} />
            </TabsTrigger>
            <TabsTrigger value="aprendizados">
              Aprendizados
              <TabCount n={projectKnowledge.length} />
            </TabsTrigger>
            <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          </TabsList>
          <TabsContent value="observacoes" className="mt-6">
            <ManualObservationSection
              projectId={id}
              domainId={project.domainId}
              isClient={isClient}
              initial={observationsList}
              rawObservations={rawObservations}
              discussions={rawDiscussions}
              attrNameById={attrNameById}
              onObservationsChange={(observs) => {
                setRawObservations(observs);
                setSvcObservations(observs.map((o) => toProjectObservation(o, attrNameById)));
              }}
              onDiscussionCreated={() => setDiscussionsRefresh((k) => k + 1)}
            />
          </TabsContent>
          <TabsContent value="aprendizados" className="mt-6">
            <ProjectDiscussionsAndKnowledge
              projectKnowledge={projectKnowledge}
              domainSlug={domain?.slug}
              domainId={domain?.id ?? ""}
              domainName={domain?.name ?? "—"}
              isStaff={!isClient}
            />
          </TabsContent>
          <TabsContent value="timeline" className="mt-6">
            <ProjectTimeline
              items={timelineItems}
              isClient={isClient}
              onOpenObservation={openObservation}
              onOpenLearnings={() => setActiveTab("aprendizados")}
            />
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-foreground">{value}</p>
    </div>
  );
}

/** Discreet count chip shown next to a tab label. */
function TabCount({ n }: { n: number }) {
  if (n === 0) return null;
  return <span className="text-[11px] font-normal tabular-nums text-muted-foreground">{n}</span>;
}

/* ------------------------------- Timeline -------------------------------- */

const timelineKind: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  observation: { label: "Observação", icon: ClipboardList, tone: "text-info bg-info/10" },
  discussion: { label: "Conversa", icon: MessageSquare, tone: "text-warning bg-warning/10" },
  knowledge: { label: "Aprendizado", icon: BookOpen, tone: "text-success bg-success/10" },
};

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ProjectTimeline({
  items,
  isClient,
  onOpenObservation,
  onOpenLearnings,
}: {
  items: TimelineItem[];
  isClient: boolean;
  onOpenObservation: (observationId?: string) => void;
  onOpenLearnings: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
        Ainda não há atividade. Observações, conversas e aprendizados aparecem aqui conforme
        acontecem no projeto.
      </div>
    );
  }

  // Group consecutive events by day, preserving the incoming (newest-first) order.
  const groups: { day: string; items: TimelineItem[] }[] = [];
  for (const it of items) {
    const day = dayLabel(it.date);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(it);
    else groups.push({ day, items: [it] });
  }

  const target = (it: TimelineItem) => {
    if (it.kind === "knowledge") return onOpenLearnings;
    if (it.kind === "observation" || it.kind === "discussion")
      return () => onOpenObservation(it.observationId);
    return undefined;
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.day}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {group.day}
          </p>
          <ol className="relative ml-3 space-y-1 border-l border-border pl-6">
            {group.items.map((it) => {
              const cfg = timelineKind[it.kind] ?? {
                label: "Evento",
                icon: ClipboardList,
                tone: "text-muted-foreground bg-muted",
              };
              const Icon = cfg.icon;
              const onClick = target(it);
              const reachable = !!onClick && !(it.kind === "discussion" && isClient);
              const Row = (
                <>
                  <span
                    className={cn(
                      "absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background",
                      cfg.tone,
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                      {cfg.label}
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {relativeTime(it.date)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-foreground">{it.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{it.actor}</p>
                </>
              );
              return (
                <li key={it.key} className="relative">
                  {reachable ? (
                    <button
                      type="button"
                      onClick={onClick}
                      className="block w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                    >
                      {Row}
                    </button>
                  ) : (
                    <div className="px-3 py-2.5">{Row}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
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
  attrNameById,
  onObservationsChange,
  onDiscussionCreated,
}: {
  projectId: string;
  domainId: string;
  isClient: boolean;
  initial: ProjectObservation[];
  rawObservations: SvcObservation[];
  discussions: SvcDiscussion[];
  attrNameById: Map<string, string>;
  onObservationsChange: (observs: SvcObservation[]) => void;
  onDiscussionCreated: () => void;
}) {
  const [items, setItems] = useState<ProjectObservation[]>(initial);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
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
    impact: "Médio" as ProjectObservation["impact"],
    risk: "Moderado" as ProjectObservation["risk"],
    interpretation: "",
    author: "Você",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    attribute: "",
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

  const applyObservationUpdate = (updated: SvcObservation) => {
    const display = toProjectObservation(updated, attrNameById);
    setItems((prev) => prev.map((o) => (o.id === updated.id ? display : o)));
    onObservationsChange(rawObservations.map((o) => (o.id === updated.id ? updated : o)));
  };

  const prependObservation = (created: SvcObservation) => {
    setItems((prev) => [toProjectObservation(created, attrNameById), ...prev]);
    onObservationsChange([created, ...rawObservations]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || submitting) return;

    setSubmitting(true);
    try {
      const created = await createObservation(projectId, {
        title: form.title.trim(),
        description: form.description.trim(),
        attributeId: form.attribute,
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
        }));
      }, 1400);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (observationId: string) => {
    const raw = rawObservations.find((o) => o.id === observationId);
    if (!raw) return;

    setEditForm({
      title: raw.title,
      description: raw.description,
      attribute: raw.attributeId ?? "",
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

    setEditSubmitting(true);
    try {
      const updated = await updateObservation(editingId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        attributeId: editForm.attribute,
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
      title: `Conversa sobre: ${display?.title ?? raw?.title ?? "observação"}`,
      question: "O que esta observação revela e o que devemos fazer a respeito?",
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

    setDiscussionSubmitting(true);
    try {
      const created = await createDiscussion({
        title: discussionForm.title.trim(),
        question: discussionForm.question.trim(),
        domainId,
        projectId,
        observationId: discussionObsId,
        status: statusCodes[discussionForm.status],
        visibility: visibilityCodes[discussionForm.visibility],
        createdBy: currentUserId,
      });

      const linked = await linkObservationToDiscussion(discussionObsId, created.id);
      if (linked) applyObservationUpdate(linked);

      onDiscussionCreated();
      toast.success("Conversa iniciada com sucesso.");
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
        title="Observações"
        description="O que o observatório registrou neste projeto."
        action={
          isClient ? undefined : (
            <div className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Registrar observação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                  <DialogHeader>
                    <DialogTitle>Registrar nova observação</DialogTitle>
                    <DialogDescription>
                      Registre uma evidência observada no projeto: descrição, atributo afetado e sua
                      interpretação inicial.
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

      {items.length === 0 && (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-[12.5px] leading-relaxed text-muted-foreground">
          <p>
            Tudo começa por aqui. Registre a primeira observação do projeto — uma evidência do que
            você notou — e a partir dela inicie conversas e consolide aprendizados.
          </p>
          {!isClient && (
            <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Registrar primeira observação
            </Button>
          )}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {items.map((o) => (
          <article
            key={o.id}
            id={`obs-${o.id}`}
            className="scroll-mt-24 rounded-xl border border-border bg-card p-5"
          >
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

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
              <Meta label="Atributo" value={o.attribute} />
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
                <div className="flex items-center gap-1">
                  {!discussions.some((d) => d.observationId === o.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2.5 text-[11px]"
                      onClick={() => openDiscussion(o.id)}
                    >
                      <MessageSquare className="h-3 w-3" /> Iniciar conversa
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                    onClick={() => openEdit(o.id)}
                  >
                    <PenSquare className="h-3 w-3" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                    disabled={analyzingId === o.id || o.status === "em análise"}
                    onClick={() => handleMarkAnalyzed(o.id)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {analyzingId === o.id ? "Atualizando…" : "Analisada"}
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
  domainId,
  domainName,
  isStaff,
}: {
  projectKnowledge: CommunityKnowledge[];
  domainSlug?: string;
  domainId: string;
  domainName: string;
  isStaff: boolean;
}) {
  const [rawDomainItems, setRawDomainItems] = useState<Knowledge[]>([]);
  const [synthesis, setSynthesis] = useState<DomainSynthesis | null>(null);
  const [synthLoading, setSynthLoading] = useState(false);

  useEffect(() => {
    if (!domainId) return;
    let cancelled = false;
    getKnowledgeByDomain(domainId)
      .then((items) => {
        if (!cancelled) setRawDomainItems(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [domainId]);

  const domainKnowledge = useMemo(() => {
    const ownIds = new Set(projectKnowledge.map((k) => k.id));
    return rawDomainItems
      .filter((k) => !ownIds.has(k.id))
      .map((k) => toCommunityKnowledge(k, { domain: domainName }));
  }, [rawDomainItems, projectKnowledge, domainName]);

  const handleSynthesize = async () => {
    if (synthLoading || !domainId) return;
    setSynthLoading(true);
    try {
      const result = await synthesizeDomain(domainId);
      setSynthesis(result);
    } catch {
      toast.error("Nao foi possivel sintetizar o dominio. Tente novamente.");
    } finally {
      setSynthLoading(false);
    }
  };

  const communityLink = domainSlug ? (
    <Link to="/community/$slug" params={{ slug: domainSlug }}>
      Ir para a comunidade <ArrowRight className="h-3 w-3" />
    </Link>
  ) : (
    <Link to="/community">
      Ir para a comunidade <ArrowRight className="h-3 w-3" />
    </Link>
  );

  return (
    <section className="space-y-10">
      {/* Aprendizados do projeto */}
      <div>
        <SectionTitle
          eyebrow="O que este projeto ensinou"
          title="Aprendizados do projeto"
          description="Consolidacoes que nasceram das conversas sobre as observacoes."
          action={
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              {communityLink}
            </Button>
          }
        />
        {projectKnowledge.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
            Nenhum aprendizado consolidado ainda. Quando as conversas das observacoes amadurecem, o
            consultor as consolida na comunidade e o resultado aparece aqui.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {projectKnowledge.map((k) => (
              <article key={k.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-3 w-3" /> Aprendizado
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
                    recomendacao ·{" "}
                  </span>
                  {k.recommendation}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Confianca: <span className="font-medium text-foreground">{k.confidence}</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Aprendizados do dominio (T2.1) + Conectora sob demanda (T2.2) */}
      <div>
        <SectionTitle
          eyebrow="Reaproveitamento"
          title="Aprendizados do dominio"
          description="Aprendizados consolidados de projetos deste dominio — reaproveitaveis aqui."
          action={
            isStaff ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSynthesize}
                disabled={synthLoading || !domainId}
                className="gap-1.5"
              >
                {synthLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Sintetizar padroes do dominio
              </Button>
            ) : undefined
          }
        />

        {synthesis && (
          <div className="mt-4 space-y-4 rounded-xl border border-border bg-card p-5">
            <p className="text-[13px] leading-relaxed text-foreground/90">{synthesis.summary}</p>
            {synthesis.patterns.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  // padroes identificados
                </p>
                <ul className="mt-2 space-y-1">
                  {synthesis.patterns.map((p, i) => (
                    <li key={i} className="text-[12.5px] leading-relaxed text-foreground/90">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {synthesis.lessons.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  // licoes aprendidas
                </p>
                <ul className="mt-2 space-y-1">
                  {synthesis.lessons.map((l, i) => (
                    <li key={i} className="text-[12.5px] leading-relaxed text-foreground/90">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {domainKnowledge.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
            Ainda nao ha aprendizados consolidados neste dominio para reaproveitar.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {domainKnowledge.map((k) => (
              <KnowledgeCard key={k.id} k={k} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
