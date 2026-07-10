import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FeedEventItem } from "@/components/feed-event-item";
import { getFeed, type FeedEvent } from "@/services/feedService";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "ObiOne" },
      {
        name: "description",
        content: "Linha do tempo do observatório: observações, conversas e aprendizados.",
      },
    ],
  }),
  component: FeedPage,
});

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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

  // Group consecutive events by day, preserving the newest-first order.
  const groups = useMemo(() => {
    const out: { day: string; items: FeedEvent[] }[] = [];
    for (const e of events) {
      const day = dayLabel(e.createdAt);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(e);
      else out.push({ day, items: [e] });
    }
    return out;
  }, [events]);

  return (
    <AppShell>
      <PageHeader
        title="Atividade do observatório"
        description="O que aconteceu nos projetos, do mais recente ao mais antigo."
      />
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        {loading ? (
          <p className="text-[12.5px] text-muted-foreground">Carregando atividade…</p>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-[12.5px] leading-relaxed text-muted-foreground">
            Sem atividade registrada ainda — observações, conversas e aprendizados aparecerão aqui.
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.day}>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {group.day}
                </p>
                <ul className="rounded-xl border border-border bg-card px-4 divide-y divide-border">
                  {group.items.map((e) => (
                    <FeedEventItem key={`${e.kind}-${e.id}`} e={e} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
