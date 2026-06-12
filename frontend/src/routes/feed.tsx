import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FeedEventItem } from "@/components/feed-event-item";
import { getFeed, type FeedEvent } from "@/services/feedService";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Atividade — ObiOne" },
      {
        name: "description",
        content: "Linha do tempo do observatório: observações, discussões e conhecimentos.",
      },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeed({ limit: 100 })
      .then((feed) => {
        if (!cancelled) setEvents(feed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Atividade do observatório"
        description="Tudo o que aconteceu nos projetos: observações registradas, discussões abertas e conhecimento consolidado, do mais recente ao mais antigo."
      />
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        {loading ? (
          <p className="text-[12.5px] text-muted-foreground">Carregando atividade…</p>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
            Sem atividade registrada ainda — observações, discussões e conhecimentos aparecerão
            aqui.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border px-4">
              {events.map((e) => (
                <FeedEventItem key={`${e.kind}-${e.id}`} e={e} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}
