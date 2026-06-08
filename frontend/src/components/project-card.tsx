import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { ArrowUpRight } from "lucide-react";

export function ProjectCard({ project }: { project: Project }) {
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

      {/* Progress */}
      <div className="mt-5">
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

      {/* Tags + footer */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {project.tags.map((t) => (
          <span
            key={t}
            className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="truncate">{project.owner}</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="font-mono">{updated}</span>
        </div>
      </div>
    </Link>
  );
}
