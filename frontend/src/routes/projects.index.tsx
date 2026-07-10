import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { StatusBadge } from "@/components/status-badge";
import { type ProjectStatus, type Project as LegacyProject } from "@/lib/mock-data";
import type { Project as SvcProject, ProjectStatusCode, ProjectTypeCode } from "@/types/project";
import type { Domain as SvcDomain } from "@/types/domain";
import { getProjects } from "@/services/projectService";
import { getDomains } from "@/services/domainService";
import { Plus, Search, ArrowUpRight } from "lucide-react";
import { toBrDate } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "ObiOne" },
      {
        name: "description",
        content:
          "Catálogo dos projetos observados pelo ObiOne dentro dos domínios organizacionais.",
      },
    ],
  }),
  component: ProjectsCatalog,
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

function ObservedProjectCard({ project }: { project: LegacyProject }) {
  const updated = toBrDate(project.updatedAt);

  return (
    <Link
      to="/projects/$id"
      params={{ id: project.id }}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-foreground/30 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="uppercase tracking-wider">{project.domain}</span>
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

      <div className="mt-4 flex items-center justify-between gap-3 text-[11.5px]">
        <div className="min-w-0">
          <span className="text-muted-foreground">Cliente </span>
          <span className="font-medium text-foreground">{project.clientName ?? "—"}</span>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progresso</span>
          <span className="text-foreground">{project.progress}%</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        Atualizado em {updated}
      </div>
    </Link>
  );
}

function ProjectsCatalog() {
  const { isClient } = useCurrentUser();
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
      projects.filter((p) => !query.trim() || p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  return (
    <AppShell>
      <PageHeader
        title={isClient ? "Meu projeto" : "Projetos"}
        description={
          isClient
            ? "O caso do seu projeto observado pelo ObiOne."
            : "Casos observados pelo ObiOne dentro dos domínios organizacionais."
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
        {/* Busca */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground lg:max-w-xs">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome do projeto…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum projeto encontrado para a busca.</p>
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
