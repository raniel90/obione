import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { DomainBadge } from "@/components/domain-badge";
import type { ThemeSuggestion } from "@/lib/api/types";

interface Props {
  suggestion: ThemeSuggestion;
  onAccept?: () => void;
  accepting?: boolean;
}

export function ThemeSuggestionCard({ suggestion, onAccept, accepting }: Props) {
  const pct = Math.round(suggestion.confidence * 100);
  return (
    <div className="rounded-md border p-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <DomainBadge domain={suggestion.suggested_domain} />
        <span className="text-muted-foreground">confiança {pct}%</span>
      </div>
      {suggestion.reasoning && (
        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{suggestion.reasoning}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">modelo: {suggestion.model_id}</span>
        {suggestion.accepted ? (
          <span className="text-xs text-muted-foreground">
            ✓ aceita
            {suggestion.accepted_at
              ? ` em ${format(parseISO(suggestion.accepted_at), "dd/MM/yyyy")}`
              : ""}
          </span>
        ) : onAccept ? (
          <Button size="sm" onClick={onAccept} disabled={accepting}>
            {accepting ? "Aceitando…" : "Aceitar"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
