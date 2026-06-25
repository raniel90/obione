import { Link } from "@tanstack/react-router";
import type { FeedEvent } from "@/services/feedService";
import { ClipboardList, MessageSquare, BookOpen, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const kindConfig: Record<
  string,
  {
    label: string;
    /** Past-tense action so each item reads as a sentence. */
    verb: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    tab: "observacoes" | "aprendizados";
  }
> = {
  observation: {
    label: "Observação",
    verb: "registrou esta observação",
    icon: ClipboardList,
    tone: "text-info bg-info/10",
    tab: "observacoes",
  },
  discussion: {
    label: "Conversa",
    verb: "iniciou esta conversa",
    icon: MessageSquare,
    tone: "text-warning bg-warning/10",
    tab: "observacoes",
  },
  knowledge: {
    label: "Aprendizado",
    verb: "consolidou este aprendizado",
    icon: BookOpen,
    tone: "text-success bg-success/10",
    tab: "aprendizados",
  },
};

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ontem" : `${days} dias atrás`;
}

export function FeedEventItem({ e }: { e: FeedEvent }) {
  const kind = kindConfig[e.kind] ?? {
    label: "Evento",
    verb: "registrou",
    icon: Eye,
    tone: "text-muted-foreground bg-muted",
    tab: "observacoes" as const,
  };
  const Icon = kind.icon;
  const actor = e.actorName ?? "Observatório";

  const body = (
    <>
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          kind.tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              kind.tone,
            )}
          >
            {kind.label}
          </span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            {relativeTime(e.createdAt)}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] font-medium leading-snug text-foreground">{e.title}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          <span className="text-foreground/80">{actor}</span> {kind.verb}
          {e.projectName ? ` · ${e.projectName}` : ""}
        </p>
      </div>
    </>
  );

  // Land where the user can act: a conversa/observação opens the project's
  // Observações tab (where the thread lives); um aprendizado abre a aba
  // Aprendizados. Sem projeto vinculado, cai na comunidade.
  if (e.projectId != null) {
    return (
      <li>
        <Link
          to="/projects/$id"
          params={{ id: String(e.projectId) }}
          search={{ tab: kind.tab }}
          className="-mx-2 flex gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        to="/community"
        className="-mx-2 flex gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
      >
        {body}
      </Link>
    </li>
  );
}
