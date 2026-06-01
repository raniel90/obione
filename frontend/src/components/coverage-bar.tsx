import { Progress } from "@/components/ui/progress";

interface Props {
  percentage: number;
  filled: number;
  total: number;
}

export function CoverageBar({ percentage, filled, total }: Props) {
  const pct = Math.round(percentage);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Cobertura</span>
        <span className="font-medium">
          {pct}% ({filled}/{total})
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
