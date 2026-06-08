import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DomainBadge } from "@/components/domain-badge";
import { ThemeSuggestionCard } from "./theme-suggestion-card";
import { useThemeSuggestions } from "@/lib/queries/use-theme-suggestions";
import { useSuggestTheme } from "@/lib/queries/use-suggest-theme";
import { useAcceptTheme } from "@/lib/queries/use-accept-theme";
import { DOMAIN_LABELS } from "@/lib/mpo/catalog";
import type { Domain } from "@/lib/api/types";

interface Props {
  projectId: string;
  currentDomain: Domain;
}

export function ThemeSection({ projectId, currentDomain }: Props) {
  const suggestionsQ = useThemeSuggestions(projectId);
  const suggestMutation = useSuggestTheme(projectId);
  const acceptMutation = useAcceptTheme(projectId);

  const suggestions = suggestionsQ.data ?? [];
  const current = suggestions[0];
  const history = suggestions.slice(1);

  function handleSuggest() {
    suggestMutation.mutate(undefined, {
      onSuccess: () => toast.success("Sugestão gerada"),
      onError: () => toast.error("Não foi possível gerar a sugestão."),
    });
  }

  function handleAccept() {
    if (!current) return;
    const domain = current.suggested_domain;
    acceptMutation.mutate(current.id, {
      onSuccess: () => toast.success(`Domínio aceito: ${DOMAIN_LABELS[domain]}`),
      onError: () => toast.error("Não foi possível aceitar a sugestão."),
    });
  }

  return (
    <section aria-label="Domínio do projeto">
      <Separator className="mb-4" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Domínio (classificação IA)</h2>
        <Button onClick={handleSuggest} disabled={suggestMutation.isPending} size="sm">
          {suggestMutation.isPending ? "Gerando…" : "Sugerir domínio (IA)"}
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        Domínio atual: <DomainBadge domain={currentDomain} />
      </div>

      {suggestionsQ.isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : suggestionsQ.isError ? (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="mb-2 text-destructive">Erro ao carregar sugestões.</p>
          <Button variant="outline" size="sm" onClick={() => suggestionsQ.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : !current ? (
        <p className="text-muted-foreground">Nenhuma sugestão ainda. Gere uma com a IA.</p>
      ) : (
        <div className="space-y-4">
          <ThemeSuggestionCard
            suggestion={current}
            onAccept={handleAccept}
            accepting={acceptMutation.isPending}
          />
          {history.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Histórico</h3>
              {history.map((s) => (
                <ThemeSuggestionCard key={s.id} suggestion={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
