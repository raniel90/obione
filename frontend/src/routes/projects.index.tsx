import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { statusLabels, type ProjectStatus, type Project as LegacyProject } from "@/lib/mock-data";
import type { Project as SvcProject, ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import type { Domain as SvcDomain } from "@/types/domain";
import { getProjects } from "@/services/projectService";
import { getDomains } from "@/services/domainService";
import { phenomena } from "@/lib/observatory-data";
import { Plus, Filter, Search, ArrowUpRight, AlertTriangle, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projetos — ObiOne" },
      {
        name: "description",
        content:
          "Catálogo dos projetos observados pelo ObiOne dentro dos domínios organizacionais.",
      },
    ],
  }),
  component: ProjectsCatalog,
});

type Risk = "Baixo" | "Moderado" | "Elevado";

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

function toLegacy(p: SvcProject, domainMap: Map<string, string>): LegacyProject {
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

function deriveRisk(p: LegacyProject): Risk {
  if (p.status === "completed") return "Baixo";
  if (p.status === "paused") return "Elevado";
  if (p.status === "active" && p.progress < 40) return "Elevado";
  if (p.status === "review" && p.progress < 70) return "Moderado";
  if (p.status === "planning") return "Moderado";
  return p.progress < 50 ? "Moderado" : "Baixo";
}

const riskTone: Record<Risk, string> = {
  Baixo: "border-success/30 text-success bg-success/5",
  Moderado: "border-warning/30 text-warning bg-warning/5",
  Elevado: "border-destructive/30 text-destructive bg-destructive/5",
};

function phenomenaForDomain(domainName: string) {
  return phenomena.filter((ph) => ph.domain === domainName);
}

function ObservedProjectCard({ project }: { project: LegacyProject }) {
  const risk = deriveRisk(project);
  const linked = phenomenaForDomain(project.domain);
  const updated = new Date(project.updatedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <Link
      to="/projects/$id"
      params={{ id: project.id }}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-foreground/30 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono uppercase tracking-wider">{project.domain}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{project.model}</span>
          </div>
          <h3 className="mt-1.5 truncate text-[15px] font-semibold tracking-tight text-foreground">
            {project.name}
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {project.summary}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]">
        <div>
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="truncate font-medium text-foreground">{project.clientName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Consultor</dt>
          <dd className="truncate font-medium text-foreground">{project.owner}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd><StatusBadge status={project.status} /></dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Risco</dt>
          <dd>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                riskTone[risk],
              )}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {risk}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progresso</span>
          <span className="font-mono text-foreground">{project.progress}%</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Radar className="h-3 w-3" />
          {linked.length} fenômeno{linked.length === 1 ? "" : "s"} associado{linked.length === 1 ? "" : "s"}
        </span>
        <span className="font-mono">Últ. obs · {updated}</span>
      </div>

      <div className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
        Observar projeto
        <ArrowUpRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

const STATUSES: (ProjectStatus | "all")[] = ["all", "active", "planning", "review", "paused", "completed"];
const RISKS: ("all" | Risk)[] = ["all", "Baixo", "Moderado", "Elevado"];

function ProjectsCatalog() {
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [domainId, setDomainId] = useState<string>("all");
  const [risk, setRisk] = useState<"all" | Risk>("all");
  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState<SvcDomain[]>([]);
  const [svcProjects, setSvcProjects] = useState<SvcProject[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDomains(), getProjects()]).then(([d, p]) => {
      if (cancelled) return;
      setDomains(d);
      setSvcProjects(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const projects = useMemo(() => {
    const map = new Map(domains.map((d) => [d.id, d.name]));
    return svcProjects.map((p) => toLegacy(p, map));
  }, [svcProjects, domains]);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (status !== "all" && p.status !== status) return false;
        if (domainId !== "all" && p.domainId !== domainId) return false;
        if (risk !== "all" && deriveRisk(p) !== risk) return false;
        if (query.trim() && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [projects, status, domainId, risk, query],
  );

  return (
    <AppShell>
      <PageHeader
        title="Projetos"
        description="Casos observados pelo ObiOne dentro dos domínios organizacionais."
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
        {/* Filtros */}
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground lg:max-w-xs">
            <Search className="h-3.5 w-3.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome do projeto…"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Filter className="h-3 w-3" /> Domínio
              </span>
              <select
                value={domainId}
                onChange={(e) => setDomainId(e.target.value)}
                className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-ring"
              >
                <option value="all">Todos</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Risco</span>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as "all" | Risk)}
                className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-ring"
              >
                {RISKS.map((r) => (
                  <option key={r} value={r}>{r === "all" ? "Todos" : r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 pr-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Status
          </span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                status === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "all" ? "Todos" : statusLabels[s]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum projeto encontrado para os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <ObservedProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
