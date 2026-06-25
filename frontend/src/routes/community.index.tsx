import { useEffect, useState } from "react";
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import {
  Users,
  MessageSquare,
  Activity,
  Layers,
  ArrowUpRight,
  BookOpen,
  Eye,
  Sparkles,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  communityStatusLabels,
  type CommunityStatus,
  type DiscussionStatus,
  type KnowledgeStatus,
  type KnowledgeConfidence,
} from "@/lib/community-data";
import {
  KpiCard,
  Mini,
  SectionHeader,
  discussionStatusTone,
  knowledgeStatusTone,
} from "@/components/community-pieces";
import { getCommunityOverview } from "@/services/communityService";
import type { CommunityOverview, DomainCommunitySummary } from "@/types/community";
import type { DiscussionStatusCode } from "@/types/discussion";
import type { KnowledgeConfidenceCode, KnowledgeStatusCode } from "@/types/knowledge";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Comunidade — ObiOne" },
      {
        name: "description",
        content:
          "Hub da comunidade do ObiOne: indicadores, comunidades, conversas e aprendizados recentes.",
      },
    ],
  }),
  component: CommunityPage,
});

const communityStatusTone: Record<string, string> = {
  ativa: "bg-success/10 text-success border-success/20",
  monitorada: "bg-foreground/5 text-foreground/70 border-border",
  "em-formação": "bg-info/10 text-info border-info/20",
};

const communityStatusFromCode: Record<DomainCommunitySummary["status"], CommunityStatus> = {
  ACTIVE: "ativa",
  MONITORED: "monitorada",
  FORMING: "em-formação",
};

const discussionStatusFromCode: Record<DiscussionStatusCode, DiscussionStatus> = {
  OPEN: "Aberta",
  IN_ANALYSIS: "Em análise",
  REVIEWED: "Revisada",
  CONSOLIDATED: "Consolidada",
  ARCHIVED: "Arquivada",
};

const knowledgeStatusFromCode: Record<KnowledgeStatusCode, KnowledgeStatus> = {
  PROPOSED: "Proposto",
  IN_REVIEW: "Em revisão",
  CONSOLIDATED: "Consolidado",
};

const confidenceFromCode: Record<KnowledgeConfidenceCode, KnowledgeConfidence> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};

function CommunityStatusPill({ status }: { status: CommunityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        communityStatusTone[status],
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {communityStatusLabels[status]}
    </span>
  );
}

interface CommunityCard {
  id: string;
  domainId: string;
  domainSlug: string;
  domain: string;
  description: string;
  participants: number;
  linkedProjects: number;
  discussions: number;
  insights: number;
  status: CommunityStatus;
}

interface DiscussionCard {
  id: string;
  title: string;
  domain: string;
  domainSlug: string;
  contributions: number;
  lastParticipant: string;
  status: DiscussionStatus;
}

interface KnowledgeCard {
  id: string;
  title: string;
  domain: string;
  domainSlug: string;
  summary: string;
  status: KnowledgeStatus;
  confidence: KnowledgeConfidence;
}

function CommunityPage() {
  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [communities, setCommunities] = useState<CommunityCard[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionCard[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeCard[]>([]);
  const [loading, setLoading] = useState(true);

  // When arriving via "Ver todos" from the home (/community#aprendizados),
  // Arriving via "Ver todos" from the home (/community#aprendizados): scroll to
  // the learnings section once its content has loaded (TanStack's native
  // hash-scroll fires before the async cards render, so we redo it here) and
  // add a brief highlight so the user lands clearly on the learnings.
  const hash = useLocation({ select: (l) => l.hash });
  const [highlightLearnings, setHighlightLearnings] = useState(false);
  useEffect(() => {
    if (hash !== "aprendizados" || loading) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.getElementById("aprendizados");
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setHighlightLearnings(true);
    const t = setTimeout(() => setHighlightLearnings(false), reduce ? 0 : 1400);
    return () => clearTimeout(t);
  }, [hash, loading]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCommunityOverview().then((co) => {
      if (cancelled) return;
      setOverview(co.overview);

      setCommunities(
        co.domains.map<CommunityCard>((d) => ({
          id: d.id,
          domainId: d.domainId,
          domainSlug: d.domainSlug,
          domain: d.domainName,
          description: d.description,
          participants: d.participants,
          linkedProjects: d.projectCount,
          discussions: d.discussionCount,
          insights: d.knowledgeCount,
          status: communityStatusFromCode[d.status],
        })),
      );

      setDiscussions(
        co.recentDiscussions.map<DiscussionCard>((d) => ({
          id: d.id,
          title: d.title,
          domain: d.domainName,
          domainSlug: d.domainSlug,
          contributions: d.contributionsCount,
          lastParticipant: "Comunidade",
          status: discussionStatusFromCode[d.status],
        })),
      );

      setKnowledge(
        co.recentKnowledge.map<KnowledgeCard>((k) => ({
          id: k.id,
          title: k.title,
          domain: k.domainName,
          domainSlug: k.domainSlug,
          summary: k.summary,
          status: knowledgeStatusFromCode[k.status],
          confidence: confidenceFromCode[k.confidence],
        })),
      );

      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !overview) {
    return (
      <AppShell>
        <PageHeader title="Comunidade" description="Carregando dados da comunidade…" />
      </AppShell>
    );
  }

  const recentDiscussions = discussions.slice(0, 3);
  const recentKnowledge = knowledge.slice(0, 3);
  const consolidatedKnowledgeCount = overview.collaborativeInsights;

  return (
    <AppShell>
      <PageHeader
        title="Comunidade"
        description="Espaço onde consultoria e clientes conversam sobre observações e consolidam aprendizados dos projetos."
      />

      <div className="px-6 py-8 md:px-10 space-y-12">
        {/* KPIs globais */}
        <section>
          <SectionHeader
            title="Indicadores"
            tooltip="Números agregados de todas as comunidades: participantes, conversas e aprendizados consolidados."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            <KpiCard label="Comunidades ativas" value={overview.activeCommunities} icon={Layers} />
            <KpiCard
              label="Participantes autorizados"
              value={overview.authorizedParticipants}
              icon={Users}
            />
            <KpiCard
              label="Conversas"
              value={overview.observationalDiscussions}
              icon={MessageSquare}
            />
            <KpiCard label="Aprendizados" value={consolidatedKnowledgeCount} icon={BookOpen} />
            <KpiCard
              label="Contribuições recentes"
              value={overview.recentContributions}
              icon={Activity}
            />
          </div>
        </section>

        {/* Comunidades */}
        <section>
          <SectionHeader
            title="Comunidades"
            tooltip="Cada comunidade reúne consultoria e clientes para conversar sobre as evidências dos projetos e transformar observações em aprendizados. Há uma comunidade para cada domínio."
          />

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c) => {
              return (
                <Link
                  key={c.id}
                  to="/community/$slug"
                  params={{ slug: c.domainSlug }}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-[14.5px] font-semibold tracking-tight text-foreground">
                          {c.domain}
                        </h3>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          Domínio: {c.domain}
                        </p>
                      </div>
                    </div>
                    <CommunityStatusPill status={c.status} />
                  </div>

                  <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                    <Mini label="Participantes" value={c.participants} />
                    <Mini label="Projetos vinculados" value={c.linkedProjects} />
                    <Mini label="Discussões abertas" value={c.discussions} />
                    <Mini label="Aprendizados" value={c.insights} />
                  </div>

                  <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                      Entrar na comunidade
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent discussions preview */}
        <section>
          <SectionHeader
            title="Conversas recentes"
            tooltip="Últimas conversas abertas nas comunidades. Abra um card para acompanhar na comunidade correspondente."
          />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recentDiscussions.map((d) => {
              return (
                <Link
                  key={d.id}
                  to="/community/$slug"
                  params={{ slug: d.domainSlug }}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-mono uppercase tracking-wider">{d.domain}</span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        discussionStatusTone[d.status],
                      )}
                    >
                      {d.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-[13.5px] font-semibold leading-snug tracking-tight text-foreground">
                    {d.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {d.contributions} contribuições
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CircleDot className="h-3 w-3" />
                      {d.lastParticipant}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent knowledge preview */}
        <section
          id="aprendizados"
          className={cn(
            "scroll-mt-20 rounded-2xl transition-shadow duration-700",
            highlightLearnings && "shadow-[0_0_0_2px_var(--color-ring)]",
          )}
        >
          <SectionHeader
            title="Aprendizados recentes"
            tooltip="Aprendizados que as comunidades consolidaram a partir das conversas e evidências dos projetos."
          />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recentKnowledge.map((k) => {
              return (
                <Link
                  key={k.id}
                  to="/community/$slug"
                  params={{ slug: k.domainSlug }}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span className="font-mono uppercase tracking-wider">{k.domain}</span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        knowledgeStatusTone[k.status],
                      )}
                    >
                      {k.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-[13.5px] font-semibold leading-snug tracking-tight text-foreground">
                    {k.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
                    {k.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {k.confidence}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> ver na comunidade
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
