import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getDomains } from "@/services/domainService";
import { getProjects } from "@/services/projectService";
import { getPhenomena } from "@/services/phenomenonService";
import { getKnowledge } from "@/services/knowledgeService";
import { getDiscussions } from "@/services/discussionService";
import type { Domain, DomainStatusCode, DomainTypeCode } from "@/types/domain";
import type { Project } from "@/types/project";
import type { Phenomenon } from "@/types/phenomenon";
import type { Knowledge } from "@/types/knowledge";
import type { Discussion } from "@/types/discussion";
import {
  Plus,
  Layers,
  LayoutGrid,
  Radar,
  BookOpen,
  MessageSquare,
  ArrowUpRight,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/domains/")({
  head: () => ({
    meta: [
      { title: "Domínios — ObiOne" },
      {
        name: "description",
        content: "Áreas de atuação da consultoria que agrupam projetos, fenômenos e conhecimento.",
      },
    ],
  }),
  component: DomainsPage,
});

/* ------------------------------- Labels ------------------------------- */

const typeLabels: Record<DomainTypeCode, string> = {
  STRATEGIC: "Estratégico",
  MANAGERIAL: "Gerencial",
  HYBRID: "Híbrido",
  ACADEMIC: "Acadêmico",
};

const statusLabels: Record<DomainStatusCode, string> = {
  ACTIVE: "Ativo",
  FORMING: "Em formação",
  MONITORED: "Monitorado",
  IN_REVIEW: "Em revisão",
};

const statusTone: Record<DomainStatusCode, string> = {
  ACTIVE: "bg-success/10 text-success border-success/20",
  FORMING: "bg-info/10 text-info border-info/20",
  MONITORED: "bg-foreground/5 text-foreground/70 border-border",
  IN_REVIEW: "bg-warning/15 text-warning border-warning/25",
};

function StatusPill({ status }: { status: DomainStatusCode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        statusTone[status],
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

/* ---------------------------- Section header ---------------------------- */

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

/* -------------------------------- KPIs -------------------------------- */

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

/* -------------------------------- Página -------------------------------- */

function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [phenomena, setPhenomena] = useState<Phenomenon[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDomains(),
      getProjects().catch(() => [] as Project[]),
      getPhenomena().catch(() => [] as Phenomenon[]),
      getKnowledge().catch(() => [] as Knowledge[]),
      getDiscussions().catch(() => [] as Discussion[]),
    ]).then(([domainList, projectList, phenomenonList, knowledgeList, discussionList]) => {
      if (cancelled) return;
      setDomains(domainList);
      setProjects(projectList);
      setPhenomena(phenomenonList);
      setKnowledge(knowledgeList);
      setDiscussions(discussionList);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const countByDomain = <T extends { domainId: string }>(items: T[]) => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.domainId, (map.get(item.domainId) ?? 0) + 1);
    return map;
  };

  const projectCount = countByDomain(projects);
  const phenomenonCount = countByDomain(phenomena);
  const knowledgeCount = countByDomain(knowledge);
  const discussionCount = countByDomain(discussions);

  const phenomenaByDomain = new Map<string, Phenomenon[]>();
  for (const ph of phenomena) {
    const list = phenomenaByDomain.get(ph.domainId) ?? [];
    list.push(ph);
    phenomenaByDomain.set(ph.domainId, list);
  }

  return (
    <AppShell>
      <PageHeader
        title="Domínios"
        description="Áreas de atuação da consultoria que agrupam projetos, fenômenos e conhecimento."
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/domains/new">
              <Plus className="h-3.5 w-3.5" />
              Novo domínio
            </Link>
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10">
        {/* Visão geral */}
        <section>
          <SectionHeader
            title="Visão geral"
            tooltip="Totais calculados a partir dos registros do observatório: projetos, fenômenos e conhecimentos vinculados aos domínios."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Domínios" value={domains.length} icon={Layers} />
            <KpiCard label="Projetos" value={projects.length} icon={LayoutGrid} />
            <KpiCard label="Fenômenos" value={phenomena.length} icon={Radar} />
            <KpiCard label="Conhecimentos" value={knowledge.length} icon={BookOpen} />
          </div>
        </section>

        {/* Lista de domínios */}
        <section className="mt-12">
          <SectionHeader
            title="Todos os domínios"
            tooltip="Abra um domínio para acompanhar seus projetos, os fenômenos observados e o conhecimento consolidado pela comunidade."
            action={
              <Link
                to="/community"
                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver comunidades
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />

          {domains.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-6">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Nenhum domínio cadastrado ainda. Crie o primeiro domínio para começar a agrupar
                projetos.
              </p>
              <Button asChild size="sm" className="mt-4 gap-1.5">
                <Link to="/domains/new">
                  <Plus className="h-3.5 w-3.5" />
                  Criar domínio
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {domains.map((d) => {
                const domainPhenomena = phenomenaByDomain.get(d.id) ?? [];
                const mainPhenomenon = domainPhenomena[0];
                const nProjects = projectCount.get(d.id) ?? 0;
                const nDiscussions = discussionCount.get(d.id) ?? 0;
                const nKnowledge = knowledgeCount.get(d.id) ?? 0;
                const nPhenomena = phenomenonCount.get(d.id) ?? 0;
                return (
                  <Link
                    key={d.id}
                    to="/domains/$id"
                    params={{ id: d.id }}
                    className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {typeLabels[d.type]}
                          </span>
                          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                            {d.name}
                          </h3>
                        </div>
                      </div>
                      <StatusPill status={d.status} />
                    </div>

                    {d.description && (
                      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                        {d.description}
                      </p>
                    )}

                    {mainPhenomenon && (
                      <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Radar className="h-3 w-3" />
                            Fenômeno observado
                          </span>
                          {nPhenomena > 1 && (
                            <span className="font-mono normal-case">+{nPhenomena - 1}</span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-foreground">
                          {mainPhenomenon.name}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-5">
                      <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <LayoutGrid className="h-3 w-3" />
                            <span className="font-mono text-foreground">{nProjects}</span>
                            projeto{nProjects === 1 ? "" : "s"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="font-mono text-foreground">{nDiscussions}</span>
                            discuss{nDiscussions === 1 ? "ão" : "ões"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span className="font-mono text-foreground">{nKnowledge}</span>
                            conhecimento{nKnowledge === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-foreground/80 transition-colors group-hover:text-foreground">
                          Ver domínio
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
