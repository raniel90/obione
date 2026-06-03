import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Consistent empty-state block: a muted lucide icon over a short message and an
 * optional action. Used for page-level "nothing here yet" states so they read
 * the same across screens.
 */
export function EmptyState({ icon: Icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-14 text-center">
      <Icon className="size-8 text-muted-foreground/50" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
