import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/mock-data";
import { statusLabels } from "@/lib/mock-data";

const styles: Record<ProjectStatus, string> = {
  active: "bg-success/10 text-success border-success/20",
  planning: "bg-info/10 text-info border-info/20",
  review: "bg-warning/15 text-warning border-warning/25",
  paused: "bg-muted text-muted-foreground border-border",
  completed: "bg-foreground/5 text-foreground/70 border-border",
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-tight",
        styles[status],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" && "bg-success animate-pulse",
          status === "planning" && "bg-info",
          status === "review" && "bg-warning",
          status === "paused" && "bg-muted-foreground/60",
          status === "completed" && "bg-foreground/40",
        )}
      />
      {statusLabels[status]}
    </span>
  );
}
