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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  deleteObservation,
  getObservationsByProject,
  linkObservationToDiscussion,
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
import {
  getKnowledgeByProject,
  getKnowledgeByDomain,
  toCommunityKnowledge,
  consolidateKnowledge,
} from "@/services/knowledgeService";
import type { CommunityKnowledge } from "@/lib/community-data";
import type { Knowledge } from "@/types/knowledge";
import { suggestObservations, synthesizeDomain, structureObservation } from "@/services/aiService";
import type { DomainSynthesis, ObservationSuggestions } from "@/services/aiService";
import { KnowledgeCard, ConsolidateKnowledgeDialog } from "@/components/community-pieces";
import { BookOpen, Lightbulb } from "lucide-react";
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
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { relativeTime } from "@/components/feed-event-item";
import { cn, toBrDate } from "@/lib/utils";

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
      { title: "ObiOne" },
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
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
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

  const formatDate = toBrDate;

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
                <span className="uppercase tracking-wider">Projeto observado</span>
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
              domainName={domain?.name ?? "—"}
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
  canConsolidate,
  onConsolidate,
}: {
  discussion: SvcDiscussion;
  currentUserId: string;
  onChanged: () => void;
  canConsolidate?: boolean;
  onConsolidate?: () => void;
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
    <div className="mt-4 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          Conversa · {discussion.contributions.length} comentário
          {discussion.contributions.length === 1 ? "" : "s"}
        </div>
        {canConsolidate && onConsolidate && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2.5 text-[11px]"
            onClick={onConsolidate}
          >
            <Lightbulb className="h-3 w-3" /> Consolidar aprendizado
          </Button>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {discussion.contributions.map((c) => (
          <li key={c.id} className="text-[12.5px] leading-relaxed text-foreground">
            <span className="font-medium">{c.userName ?? "Participante"}</span>
            <span className="text-muted-foreground"> · </span>
            {c.text}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
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
                      className="block w-full rounded-lg py-2.5 pl-6 pr-3 text-left transition-colors hover:bg-muted/50"
                    >
                      {Row}
                    </button>
                  ) : (
                    <div className="py-2.5 pl-6 pr-3">{Row}</div>
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

function ManualObservationSection({
  projectId,
  domainId,
  domainName,
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
  domainName: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
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
  const [structureLoading, setStructureLoading] = useState(false);
  const [reviewRevealed, setReviewRevealed] = useState(false);
  const [fromAi, setFromAi] = useState(false);
  const [aiSuggestionId, setAiSuggestionId] = useState<number | null>(null);
  const [consolidating, setConsolidating] = useState<SvcDiscussion | null>(null);
  const [aiPanel, setAiPanel] = useState<ObservationSuggestions | null>(null);
  const [aiPanelLoading, setAiPanelLoading] = useState(false);
  const [acceptingIdx, setAcceptingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    attribute: "",
    impact: "Médio" as ProjectObservation["impact"],
    risk: "Moderado" as ProjectObservation["risk"],
    interpretation: "",
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
        // Provenance: when the draft came from the AI, the backend flips the
        // suggestion log to accepted and stamps origin AI_SUGGESTED.
        suggestionId: fromAi && aiSuggestionId != null ? aiSuggestionId : undefined,
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
          attribute: "",
        }));
        setReviewRevealed(false);
        setFromAi(false);
        setAiSuggestionId(null);
      }, 1400);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStructure = async () => {
    if (structureLoading || form.description.trim().length < 15) return;
    setStructureLoading(true);
    try {
      const result = await structureObservation(projectId, form.description.trim());
      setForm((f) => ({
        ...f,
        title: result.title,
        attribute: result.attributeId ?? "",
        interpretation: result.interpretation,
      }));
      setAiSuggestionId(result.suggestionId ?? null);
      setFromAi(true);
      setReviewRevealed(true);
    } catch {
      // Graceful degradation: the AI failed, so open the review fields for manual fill.
      toast.error("A IA não respondeu. Preencha os campos e revise manualmente.");
      setReviewRevealed(true);
    } finally {
      setStructureLoading(false);
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

  // Um clique: os padrões eram sempre aceitos, então o modal só adicionava
  // fricção. Cria a conversa e abre o thread inline na própria observação.
  const startDiscussion = async (observationId: string) => {
    if (discussionSubmitting) return;
    const display = items.find((o) => o.id === observationId);
    setDiscussionObsId(observationId);
    setDiscussionSubmitting(true);
    try {
      const created = await createDiscussion({
        title: `Conversa sobre: ${display?.title ?? "observação"}`,
        question: "O que esta observação revela e o que devemos fazer a respeito?",
        domainId,
        projectId,
        observationId,
        status: statusCodes["Aberta"],
        visibility: visibilityCodes["Participantes do projeto"],
        createdBy: currentUserId,
      });
      const linked = await linkObservationToDiscussion(observationId, created.id);
      if (linked) applyObservationUpdate(linked);
      onDiscussionCreated();
      toast.success("Conversa iniciada. Contribua no quadro abaixo.");
    } catch {
      toast.error("Não foi possível iniciar a conversa.");
    } finally {
      setDiscussionSubmitting(false);
      setDiscussionObsId(null);
    }
  };

  const confidenceToCode = { Baixo: "LOW", Médio: "MEDIUM", Alto: "HIGH" } as const;

  // A Sintetizadora agora mora onde a conversa acontece: o diálogo de revisão
  // (human-in-the-loop) abre no próprio projeto, sem trocar de tela.
  const handleConsolidate = async (k: CommunityKnowledge, suggestionId?: number) => {
    if (!consolidating) return;
    try {
      await consolidateKnowledge(consolidating.id, {
        title: k.title,
        summary: k.summary,
        evidence: k.evidences,
        recommendation: k.recommendation,
        confidence: confidenceToCode[k.confidence],
        suggestionId,
      });
      toast.success("Aprendizado consolidado. Veja na aba Aprendizados.");
      onDiscussionCreated();
    } catch {
      toast.error("Não foi possível consolidar o aprendizado.");
    }
  };

  // Observadora: sugere observações a partir do resumo do projeto; cada
  // sugestão é aceita individualmente (human-in-the-loop, painel inline).
  const handleSuggestObservations = async () => {
    if (aiPanelLoading) return;
    setAiPanelLoading(true);
    try {
      const res = await suggestObservations(projectId);
      if (!res.suggestions?.length) {
        toast.info("A IA não encontrou novas observações para sugerir.");
        return;
      }
      setAiPanel(res);
    } catch {
      toast.error("Não foi possível obter sugestões da IA.");
    } finally {
      setAiPanelLoading(false);
    }
  };

  const acceptSuggestion = async (idx: number) => {
    if (!aiPanel || acceptingIdx !== null) return;
    const s = aiPanel.suggestions[idx];
    setAcceptingIdx(idx);
    try {
      const impact = (
        ["LOW", "MEDIUM", "HIGH"].includes(s.impact) ? s.impact : "MEDIUM"
      ) as SvcObsImpact;
      const created = await createObservation(projectId, {
        title: s.title,
        description: s.description,
        attributeId: s.attributeId,
        impact,
        risk: "MODERATE",
        interpretation: "",
        status: "REGISTERED",
        createdBy: currentUserId,
        sourceExcerpt: s.sourceExcerpt,
        suggestionId: aiPanel.suggestionId,
      });
      prependObservation(created);
      const rest = aiPanel.suggestions.filter((_, i) => i !== idx);
      setAiPanel(rest.length ? { ...aiPanel, suggestions: rest } : null);
      toast.success("Observação aceita e registrada.");
    } catch {
      toast.error("Não foi possível registrar a sugestão.");
    } finally {
      setAcceptingIdx(null);
    }
  };

  const dismissSuggestion = (idx: number) => {
    if (!aiPanel) return;
    const rest = aiPanel.suggestions.filter((_, i) => i !== idx);
    setAiPanel(rest.length ? { ...aiPanel, suggestions: rest } : null);
  };

  const handleDelete = async (observationId: string) => {
    setDeleteTarget(null);
    setDeletingId(observationId);
    try {
      await deleteObservation(observationId);
      setItems((list) => list.filter((o) => o.id !== observationId));
      toast.success("Observação excluída.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir a observação.");
    } finally {
      setDeletingId(null);
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
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={aiPanelLoading}
                onClick={handleSuggestObservations}
              >
                {aiPanelLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Sugerir com IA
              </Button>
              <Dialog
                open={open}
                onOpenChange={(o) => {
                  setOpen(o);
                  if (!o) {
                    setReviewRevealed(false);
                    setFromAi(false);
                    setAiSuggestionId(null);
                    setStructureLoading(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Registrar observação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                  <DialogHeader>
                    <DialogTitle>Registrar nova observação</DialogTitle>
                    <DialogDescription>
                      Descreva o que você observou e deixe a IA estruturar o registro para você
                      revisar.
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
                        <Label htmlFor="obs-desc">O que você observou?</Label>
                        <Textarea
                          id="obs-desc"
                          rows={4}
                          placeholder="Descreva em suas palavras o que aconteceu e por que é relevante para o projeto."
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      {!reviewRevealed && (
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            size="sm"
                            disabled={structureLoading || form.description.trim().length < 15}
                            onClick={handleStructure}
                            className="gap-1.5"
                          >
                            {structureLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {structureLoading ? "Processando…" : "Avançar"}
                          </Button>
                        </div>
                      )}
                      {reviewRevealed && (
                        <div className="space-y-4">
                          {fromAi && (
                            <p className="text-[12px] text-muted-foreground">
                              Revise as sugestões da IA antes de salvar.
                            </p>
                          )}
                          <div className="space-y-1.5">
                            <Label htmlFor="obs-title">Título</Label>
                            <Input
                              id="obs-title"
                              placeholder="Ex.: Cliente solicitou nova alteração de escopo após aprovação inicial"
                              value={form.title}
                              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            />
                          </div>
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
                        </div>
                      )}
                      {reviewRevealed && (
                        <DialogFooter>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={submitting || !form.title.trim()}
                          >
                            {submitting ? "Registrando…" : "Registrar observação"}
                          </Button>
                        </DialogFooter>
                      )}
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
      {aiPanel && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Sugestões da Observadora · revise e aceite as que fizerem sentido
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] text-muted-foreground"
              onClick={() => setAiPanel(null)}
            >
              Dispensar todas
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {aiPanel.suggestions.map((sug, idx) => (
              <li
                key={`${sug.title}-${idx}`}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground">{sug.title}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {sug.description}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {attrNameById.get(sug.attributeId) ?? sug.attributeId}
                      {sug.sourceExcerpt && (
                        <span className="italic"> · “{sug.sourceExcerpt}”</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] text-muted-foreground"
                      disabled={acceptingIdx !== null}
                      onClick={() => dismissSuggestion(idx)}
                    >
                      Dispensar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 gap-1 px-2.5 text-[11px]"
                      disabled={acceptingIdx !== null}
                      onClick={() => acceptSuggestion(idx)}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {acceptingIdx === idx ? "Registrando…" : "Aceitar"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 space-y-3">
        {items.map((o) => (
          <article
            key={o.id}
            id={`obs-${o.id}`}
            className="scroll-mt-24 rounded-xl border border-border bg-card p-5"
          >
            <h3 className="text-[14px] font-semibold leading-snug text-foreground">{o.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-muted-foreground">
              <span className="font-medium text-foreground/80">{o.attribute}</span>
              <span aria-hidden>·</span>
              <span>{toBrDate(o.date)}</span>
              <span aria-hidden>·</span>
              <span>por {o.author}</span>
              {o.aiSuggested && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> sugerida pela IA
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {o.description}
            </p>

            {o.interpretation && (
              <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/80">
                <span className="font-medium text-foreground">Interpretação: </span>
                {o.interpretation}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted-foreground">
              {!isClient && (
                <div className="flex items-center gap-1">
                  {!discussions.some((d) => d.observationId === o.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2.5 text-[11px]"
                      disabled={discussionSubmitting && discussionObsId === o.id}
                      onClick={() => startDiscussion(o.id)}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {discussionSubmitting && discussionObsId === o.id
                        ? "Iniciando…"
                        : "Iniciar conversa"}
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
                  {!discussions.some((d) => d.observationId === o.id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                      disabled={deletingId === o.id}
                      onClick={() => setDeleteTarget(o.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingId === o.id ? "Excluindo…" : "Excluir"}
                    </Button>
                  )}
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
                  canConsolidate={!isClient && d.status !== "CONSOLIDATED"}
                  onConsolidate={() => setConsolidating(d)}
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

      <ConsolidateKnowledgeDialog
        discussion={
          consolidating
            ? toCommunityDiscussion(consolidating, {
                domain: domainName,
                originObservation: consolidating.observationId
                  ? items.find((o) => o.id === consolidating.observationId)?.title
                  : undefined,
              })
            : null
        }
        open={consolidating !== null}
        onOpenChange={(o) => {
          if (!o) setConsolidating(null);
        }}
        onConsolidate={handleConsolidate}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir observação?</AlertDialogTitle>
            <AlertDialogDescription>
              A observação será removida do projeto. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              Excluir observação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
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
                <h3 className="text-[14.5px] font-semibold leading-snug text-foreground">
                  {k.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{k.summary}</p>
                {k.recommendation && (
                  <div className="mt-3 rounded-md bg-muted/40 p-3 text-[12.5px] leading-relaxed text-foreground">
                    <span className="font-medium">Recomendação: </span>
                    {k.recommendation}
                  </div>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Confiança: <span className="font-medium text-foreground">{k.confidence}</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Aprendizados do dominio (T2.1) + Conectora sob demanda (T2.2) */}
      <div>
        <SectionTitle
          title="Aprendizados do dominio"
          description="O que outros projetos deste dominio ja ensinaram — reaproveitaveis aqui."
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
          <div className="mt-4 rounded-xl border border-dashed border-foreground/30 bg-foreground/[0.02] p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Padrões do domínio · síntese da IA, revise antes de usar
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px] text-muted-foreground"
                onClick={() => setSynthesis(null)}
              >
                Dispensar
              </Button>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">
              {synthesis.summary}
            </p>
            {synthesis.patterns.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Padrões identificados
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {synthesis.patterns.map((p, i) => (
                    <li key={i} className="text-[12.5px] leading-relaxed text-foreground/90">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {synthesis.lessons.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-muted-foreground">Lições aprendidas</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
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
