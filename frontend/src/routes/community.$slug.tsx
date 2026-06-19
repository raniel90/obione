import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  BookOpen,
  Plus,
  Layers,
  ArrowUpRight,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCommunityByDomainSlug } from "@/services/communityService";
import { getProjects } from "@/services/projectService";
import {
  addContribution,
  archiveDiscussion,
  createDiscussion,
  getDiscussionById,
  statusCodes,
  toCommunityDiscussion,
  updateDiscussionStatus,
  visibilityCodes,
  contributionTypeCodes,
} from "@/services/discussionService";
import { toast } from "sonner";
import { consolidateKnowledge, toCommunityKnowledge } from "@/services/knowledgeService";
import { suggestKnowledge } from "@/services/aiService";
import type {
  CommunityDiscussionSummary,
  CommunityKnowledgeSummary,
  CommunityParticipant,
  DomainCommunityDetail,
  DomainCommunityStatusCode,
} from "@/types/community";
import type { DiscussionStatusCode, DiscussionVisibility } from "@/types/discussion";
import type { KnowledgeConfidenceCode, KnowledgeStatusCode } from "@/types/knowledge";
import type { Project as SvcProject } from "@/types/project";
import {
  participantStatusLabels,
  roleLabels,
  communityStatusLabels,
  type CommunityKnowledge,
  type CommunityStatus,
  type Discussion,
  type DiscussionStatus,
  type KnowledgeConfidence,
  type KnowledgeStatus,
  type ParticipationType,
  type ParticipantRole,
  type ParticipantStatus,
  type VisibilityScope,
} from "@/lib/community-data";
import {
  KpiCard,
  SectionHeader,
  DiscussionCard,
  KnowledgeCard,
  CreateDiscussionDialog,
  DiscussionDetailDialog,
  ConsolidateKnowledgeDialog,
} from "@/components/community-pieces";

const communityStatusFromCode: Record<DomainCommunityStatusCode, CommunityStatus> = {
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

const visibilityFromCode: Record<DiscussionVisibility, VisibilityScope> = {
  DOMAIN: "Comunidade do domínio",
  PROJECT: "Participantes do projeto",
  CONSULTANTS: "Consultores vinculados",
  ADMINS: "Administradores",
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

const roleFromCode: Record<CommunityParticipant["role"], ParticipantRole> = {
  ADMIN: "admin",
  CONSULTANT: "consultor",
  CLIENT: "cliente",
};

const participantStatusFromCode: Record<CommunityParticipant["status"], ParticipantStatus> = {
  ACTIVE: "ativo",
  INVITED: "convidado",
  PENDING: "aguardando-validação",
};

function mapDiscussionToUi(discussion: CommunityDiscussionSummary, domainName: string): Discussion {
  return {
    id: discussion.id,
    title: discussion.title,
    domain: domainName,
    project: discussion.projectName,
    originObservation: "—",
    investigativeQuestion: discussion.question,
    contributionsList: [],
    contributions: discussion.contributionsCount,
    lastParticipant: "Comunidade",
    status: discussionStatusFromCode[discussion.status],
    visibility: visibilityFromCode[discussion.visibility],
  };
}

function mapKnowledgeToUi(item: CommunityKnowledgeSummary, domainName: string): CommunityKnowledge {
  return {
    id: item.id,
    title: item.title,
    domain: domainName,
    project: item.projectName,
    summary: item.summary,
    evidences: "",
    recommendation: item.recommendation,
    confidence: confidenceFromCode[item.confidence],
    status: knowledgeStatusFromCode[item.status],
    originDiscussion: "",
  };
}

function mapParticipantToUi(participant: CommunityParticipant, domainName: string) {
  return {
    id: participant.id,
    name: participant.name,
    role: roleFromCode[participant.role],
    domain: domainName,
    participation: participant.participation as ParticipationType,
    status: participantStatusFromCode[participant.status],
  };
}

export const Route = createFileRoute("/community/$slug")({
  head: () => ({
    meta: [
      { title: "Comunidade — ObiOne" },
      {
        name: "description",
        content: "Comunidade do domínio: projetos, conversas e aprendizados.",
      },
    ],
  }),
  component: DomainCommunityPage,
  notFoundComponent: () => (
    <AppShell>
      <PageHeader
        title="Comunidade não encontrada"
        description="O domínio solicitado não existe."
      />
      <div className="px-6 py-8 md:px-10">
        <Button asChild variant="outline" size="sm">
          <Link to="/community">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Comunidade
          </Link>
        </Button>
      </div>
    </AppShell>
  ),
});

function DomainCommunityPage() {
  const { slug } = Route.useParams();

  const [domainCommunity, setDomainCommunity] = useState<DomainCommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [knowledge, setKnowledge] = useState<CommunityKnowledge[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [consolidateOpen, setConsolidateOpen] = useState(false);

  const [svcProjects, setSvcProjects] = useState<SvcProject[]>([]);

  const confidenceToCode: Record<CommunityKnowledge["confidence"], KnowledgeConfidenceCode> = {
    Baixo: "LOW",
    Médio: "MEDIUM",
    Alto: "HIGH",
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCommunityByDomainSlug(slug), getProjects()]).then(([detail, projects]) => {
      if (cancelled) return;
      setSvcProjects(projects);
      if (!detail) {
        setDomainCommunity(null);
        setLoading(false);
        return;
      }

      setDomainCommunity(detail);
      setDiscussions(detail.discussions.map((d) => mapDiscussionToUi(d, detail.domainName)));
      setKnowledge(detail.knowledge.map((k) => mapKnowledgeToUi(k, detail.domainName)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const domainName = domainCommunity?.domainName ?? "";
  const communityStatus = domainCommunity
    ? communityStatusFromCode[domainCommunity.status]
    : "em-formação";

  const domainParticipants = useMemo(
    () => (domainCommunity?.participantsList ?? []).map((p) => mapParticipantToUi(p, domainName)),
    [domainCommunity?.participantsList, domainName],
  );

  const domainProjects = useMemo(() => {
    if (!domainCommunity) return [];
    const summaries = new Map(
      svcProjects
        .filter((p) => p.domainId === domainCommunity.domainId)
        .map((p) => [p.id, p.summary] as const),
    );

    return domainCommunity.projects.map((p) => ({
      id: p.id,
      name: p.name,
      domain: domainName,
      summary: summaries.get(p.id) ?? "",
      progress: p.progress,
      model: "Estratégico",
    }));
  }, [domainCommunity, domainName, svcProjects]);

  const openCount = discussions.filter(
    (d) => d.status === "Aberta" || d.status === "Em análise",
  ).length;
  const consolidatedCount = knowledge.filter((k) => k.status === "Consolidado").length;

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          title="Comunidade"
          description="Carregando dados da comunidade observacional…"
        />
      </AppShell>
    );
  }

  if (!domainCommunity) throw notFound();

  const updateDiscussion = (id: string, patch: Partial<Discussion>) =>
    setDiscussions((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const replaceDiscussion = (updated: Discussion) => {
    setDiscussions((list) => list.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDiscussion((current) => (current?.id === updated.id ? updated : current));
  };

  const mapDiscussionNames = (item: { projectId?: string; observationId?: string }) => {
    const projectNameById = new Map(svcProjects.map((p) => [p.id, p.name] as const));
    return {
      domain: domainName,
      project: item.projectId ? projectNameById.get(item.projectId) : undefined,
      originObservation: item.observationId ? `Observação #${item.observationId}` : undefined,
    };
  };

  return (
    <AppShell>
      <PageHeader
        title={`Comunidade: ${domainName}`}
        description={`Espaço para conversar sobre observações e consolidar aprendizados do domínio ${domainName}.`}
      />

      <div className="px-6 py-8 md:px-10 space-y-12">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Link to="/community" className="hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Comunidade
            </Link>
            <span>/</span>
            <span className="text-foreground">{domainName}</span>
            <span
              className={cn(
                "ml-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                communityStatus === "ativa"
                  ? "bg-success/10 text-success border-success/20"
                  : communityStatus === "monitorada"
                    ? "bg-foreground/5 text-foreground/70 border-border"
                    : "bg-info/10 text-info border-info/20",
              )}
            >
              <span className="h-1 w-1 rounded-full bg-current" />
              {communityStatusLabels[communityStatus]}
            </span>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Iniciar conversa
          </Button>
        </div>

        {/* Indicadores */}
        <section>
          <SectionHeader
            title="Indicadores"
            tooltip="Participação, projetos, conversas e aprendizados desta comunidade."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Participantes" value={domainParticipants.length} icon={Users} />
            <KpiCard label="Projetos vinculados" value={domainProjects.length} icon={Folder} />
            <KpiCard label="Conversas abertas" value={openCount} icon={MessageSquare} />
            <KpiCard label="Aprendizados" value={consolidatedCount} icon={BookOpen} />
          </div>
        </section>

        {/* Projetos vinculados */}
        <section>
          <SectionHeader
            title="Projetos vinculados"
            tooltip="Projetos observados por esta comunidade. Abra um projeto para ver suas observações e evidências."
          />
          {domainProjects.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              Nenhum projeto vinculado a este domínio.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {domainProjects.map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$id"
                  params={{ id: p.id }}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[13.5px] font-semibold tracking-tight text-foreground">
                      {p.name}
                    </h3>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                    {p.summary}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono uppercase tracking-wider">{p.model}</span>
                    <span>{p.progress}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Participantes do domínio */}
        <section>
          <SectionHeader
            title="Participantes"
            tooltip="Pessoas autorizadas a interpretar observações e contribuir com evidências neste domínio."
          />

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            {domainParticipants.length === 0 ? (
              <div className="p-6 text-center text-[12.5px] text-muted-foreground">
                Nenhum participante vinculado.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-3 py-2.5 text-left">Participante</th>
                    <th className="px-3 py-2.5 text-left">Perfil</th>
                    <th className="px-3 py-2.5 text-left">Participação</th>
                    <th className="px-3 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {domainParticipants.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent/70 to-info/70 text-[10px] font-semibold text-accent-foreground">
                            {p.name
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <span className="text-[13px] text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px] text-foreground">
                        {roleLabels[p.role]}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground">
                          {p.participation}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]",
                            p.status === "ativo" ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              p.status === "ativo"
                                ? "bg-success"
                                : p.status === "convidado"
                                  ? "bg-info"
                                  : "bg-warning",
                            )}
                          />
                          {participantStatusLabels[p.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Conversas */}
        <section>
          <SectionHeader
            title="Conversas"
            tooltip="Interpretações coletivas consolidadas a partir das conversas dos projetos deste domínio."
            action={
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Iniciar conversa
              </Button>
            }
          />

          {discussions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-[12.5px] text-muted-foreground">
              Nenhuma conversa registrada neste domínio.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {discussions.map((d) => (
                <DiscussionCard
                  key={d.id}
                  d={d}
                  onView={() => {
                    void getDiscussionById(d.id).then((full) => {
                      if (full) {
                        setSelectedDiscussion(
                          toCommunityDiscussion(full, mapDiscussionNames(full)),
                        );
                        return;
                      }
                      setSelectedDiscussion(d);
                    });
                  }}
                  onConsolidate={() => {
                    setSelectedDiscussion(d);
                    setConsolidateOpen(true);
                    void suggestKnowledge(d.id)
                      .then((draft) =>
                        toast.info(
                          `IA sugere consolidar como "${draft.title}": ${draft.summary} — Recomendação: ${draft.recommendation}`,
                        ),
                      )
                      .catch(() => {});
                  }}
                  onArchive={() => {
                    void archiveDiscussion(d.id).then((updated) => {
                      if (!updated) {
                        updateDiscussion(d.id, { status: "Arquivada" });
                        return;
                      }
                      replaceDiscussion(
                        toCommunityDiscussion(updated, mapDiscussionNames(updated)),
                      );
                    });
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Conhecimento produzido */}
        <section>
          <SectionHeader
            title="Aprendizados"
            tooltip="Aprendizados consolidados pela comunidade a partir das conversas e evidências deste domínio."
          />

          {knowledge.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-[12.5px] text-muted-foreground">
              Nenhum aprendizado consolidado ainda neste domínio.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {knowledge.map((k) => (
                <KnowledgeCard key={k.id} k={k} />
              ))}
            </div>
          )}
        </section>

        {/* Link related domain */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                Domínio observacional
              </h3>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Área de atuação que agrupa os projetos desta comunidade.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/domains/$id" params={{ id: domainCommunity.domainId }}>
                Abrir domínio <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Modals */}
      <CreateDiscussionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        fixedDomain={domainName}
        onCreate={(d) => {
          const domainId = domainCommunity.domainId;
          if (!domainId) {
            setDiscussions((list) => [d, ...list]);
            return;
          }

          const project = svcProjects.find((p) => p.name === d.project);

          void createDiscussion({
            title: d.title,
            question: d.investigativeQuestion,
            domainId,
            projectId: project?.id,
            status: statusCodes[d.status],
            visibility: visibilityCodes[d.visibility],
            createdBy: "",
          }).then((created) => {
            setDiscussions((list) => [
              toCommunityDiscussion(created, {
                domain: domainName,
                project: d.project,
                originObservation: d.originObservation || undefined,
              }),
              ...list,
            ]);
          });
        }}
      />
      <DiscussionDetailDialog
        discussion={selectedDiscussion}
        open={!!selectedDiscussion && !consolidateOpen}
        onOpenChange={(o) => !o && setSelectedDiscussion(null)}
        onConsolidate={() => setConsolidateOpen(true)}
        onUpdateStatus={(status) => {
          if (!selectedDiscussion) return;
          void updateDiscussionStatus(selectedDiscussion.id, statusCodes[status]).then(
            (updated) => {
              if (!updated) {
                updateDiscussion(selectedDiscussion.id, { status });
                setSelectedDiscussion({ ...selectedDiscussion, status });
                return;
              }
              replaceDiscussion(toCommunityDiscussion(updated, mapDiscussionNames(updated)));
            },
          );
        }}
        onAddContribution={(contribution) => {
          if (!selectedDiscussion) return;
          void addContribution(selectedDiscussion.id, {
            type: contributionTypeCodes[contribution.type],
            text: contribution.text,
            userId: "",
          }).then((created) => {
            if (!created) {
              const updated = {
                ...selectedDiscussion,
                contributionsList: [...selectedDiscussion.contributionsList, contribution],
                contributions: selectedDiscussion.contributions + 1,
                lastParticipant: contribution.participant,
              };
              updateDiscussion(selectedDiscussion.id, updated);
              setSelectedDiscussion(updated);
              return;
            }

            void getDiscussionById(selectedDiscussion.id).then((refreshed) => {
              if (!refreshed) return;
              replaceDiscussion(toCommunityDiscussion(refreshed, mapDiscussionNames(refreshed)));
            });
          });
        }}
      />
      <ConsolidateKnowledgeDialog
        discussion={selectedDiscussion}
        open={consolidateOpen}
        onOpenChange={(o) => {
          setConsolidateOpen(o);
          if (!o) setSelectedDiscussion(null);
        }}
        onConsolidate={(k) => {
          if (!selectedDiscussion) return;

          const discussionId = selectedDiscussion.id;
          void consolidateKnowledge(discussionId, {
            title: k.title,
            summary: k.summary,
            evidence: k.evidences,
            recommendation: k.recommendation,
            confidence: confidenceToCode[k.confidence],
          }).then((created) => {
            const projectNameById = new Map(svcProjects.map((p) => [p.id, p.name] as const));
            setKnowledge((list) => [
              toCommunityKnowledge(created, {
                domain: domainName,
                project: created.projectId ? projectNameById.get(created.projectId) : k.project,
              }),
              ...list,
            ]);
            updateDiscussion(discussionId, { status: "Consolidada" });
          });
        }}
      />
    </AppShell>
  );
}
