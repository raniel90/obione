import { Link } from "@tanstack/react-router";
import type { FeedEvent } from "@/services/feedService";
import { Radar, MessageSquare, Sparkles, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const kindConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  observation: { label: "Observação", icon: Radar, tone: "text-info bg-info/10" },
  discussion: { label: "Conversa", icon: MessageSquare, tone: "text-warning bg-warning/10" },
  knowledge: { label: "Aprendizado", icon: Sparkles, tone: "text-success bg-success/10" },
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
    icon: Eye,
    tone: "text-muted-foreground bg-muted",
  };
  const Icon = kind.icon;

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
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            {kind.label}
          </span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            {relativeTime(e.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-foreground">{e.title}</p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{e.actorName ?? "Observatório"}</span>
          {e.projectName && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="truncate">{e.projectName}</span>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (e.projectId != null) {
    return (
      <li>
        <Link
          to="/projects/$id"
          params={{ id: String(e.projectId) }}
          className="-mx-2 flex gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
        >
          {body}
        </Link>
      </li>
    );
  }

  return <li className="flex gap-3 py-3">{body}</li>;
}
