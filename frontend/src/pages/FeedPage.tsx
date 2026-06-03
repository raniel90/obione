import { Link } from "react-router-dom";
import { useFeed } from "@/lib/queries/use-feed";
import { FeedEventItem } from "@/components/feed-event-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function FeedPage() {
  const feedQ = useFeed();
  const events = feedQ.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Voltar
      </Link>

      {feedQ.isLoading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="mb-6 h-6 w-40" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <>
          <h1 className="mb-6 mt-2 text-2xl font-bold">Novidades</h1>

          {feedQ.isError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p className="mb-2 text-destructive">Erro ao carregar as novidades.</p>
              <Button variant="outline" size="sm" onClick={() => feedQ.refetch()}>
                Tentar de novo
              </Button>
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma novidade ainda.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => (
                <FeedEventItem key={event.target_id} event={event} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
