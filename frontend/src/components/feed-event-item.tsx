import type { FeedEvent } from "@/services/feedService";
import { Radar, MessageSquare, Sparkles, Eye } from "lucide-react";

const feedIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  observation: Radar,
  discussion: MessageSquare,
  knowledge: Sparkles,
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
  const Icon = feedIcon[e.kind] ?? Eye;
  return (
    <li className="flex gap-3 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-foreground">{e.title}</p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{e.actorName ?? "Observatório"}</span>
          {e.projectName && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="truncate font-mono uppercase tracking-wider">{e.projectName}</span>
            </>
          )}
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="whitespace-nowrap">{relativeTime(e.createdAt)}</span>
        </div>
      </div>
    </li>
  );
}
