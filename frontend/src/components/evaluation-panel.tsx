import type { Evaluation } from "@/lib/api/types";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export function EvaluationPanel({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <Metric label="Precision" value={pct(evaluation.precision)} />
      <Metric label="Recall" value={pct(evaluation.recall)} />
      <Metric label="F1" value={evaluation.f1.toFixed(2)} />
      <p className="col-span-3 text-xs text-muted-foreground">
        {evaluation.needs_human_review_count} atributos para revisão humana
      </p>
    </div>
  );
}
