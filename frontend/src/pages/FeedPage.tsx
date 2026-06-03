import { Bell } from "lucide-react";
import { useFeed } from "@/lib/queries/use-feed";
import { FeedEventItem } from "@/components/feed-event-item";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function FeedPage() {
  const feedQ = useFeed();
  const events = feedQ.data ?? [];

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
            <ul className="space-y-2">
              {events.map((event) => (
                <FeedEventItem key={`${event.kind}:${event.target_id}`} event={event} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
