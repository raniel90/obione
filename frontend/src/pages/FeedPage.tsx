import { Bell } from "lucide-react";
import { useFeed } from "@/lib/queries/use-feed";
import { FeedEventItem } from "@/components/feed-event-item";
import { EmptyState } from "@/components/empty-state";
import { Sparkline } from "@/components/sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { groupEventsByDay, dailyActivity } from "@/lib/feed/group-by-day";

export function FeedPage() {
  const feedQ = useFeed();
  const events = feedQ.data ?? [];
  const groups = groupEventsByDay(events);
  const activity = dailyActivity(events);
  const last7 = activity.slice(-7).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-2xl">
      {feedQ.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="mb-6 h-6 w-40" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <>
          <h1 className="mb-6 text-2xl font-bold">Novidades</h1>

          {feedQ.isError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p className="mb-2 text-destructive">Erro ao carregar as novidades.</p>
              <Button variant="outline" size="sm" onClick={() => feedQ.refetch()}>
                Tentar de novo
              </Button>
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={Bell}
              message="Nenhuma novidade ainda."
              description="Novos comentários e extrações dos seus projetos aparecem aqui."
            />
          ) : (
            <>
              {activity.length >= 2 && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border p-3">
                  <Sparkline data={activity} className="text-accent" width={120} height={28} />
                  <p className="text-xs text-muted-foreground">
                    {events.length} {events.length === 1 ? "novidade" : "novidades"} ·{" "}
                    {last7} {last7 === 1 ? "evento" : "eventos"} nos últimos 7 dias
                  </p>
                </div>
              )}
              <div className="space-y-6">
                {groups.map((group) => (
                  <section key={group.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold">{group.label}</h2>
                      <Badge variant="secondary">{group.events.length}</Badge>
                    </div>
                    <ul className="space-y-2">
                      {group.events.map((event) => (
                        <FeedEventItem
                          key={`${event.kind}:${event.target_id}`}
                          event={event}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
