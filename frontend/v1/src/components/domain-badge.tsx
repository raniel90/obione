import { Badge } from "@/components/ui/badge";
import { DOMAIN_LABELS } from "@/lib/mpo/catalog";
import type { Domain } from "@/lib/api/types";

/**
 * Restrained per-domain hues (OKLCH) used only for a small leading dot — a
 * scannable signal that keeps the chip itself quiet (no rainbow of filled
 * badges). Neutral gray for "other".
 */
const DOMAIN_DOT: Record<Domain, string> = {
  legal: "oklch(0.62 0.16 255)",
  health: "oklch(0.65 0.15 152)",
  sports: "oklch(0.68 0.16 50)",
  branding: "oklch(0.62 0.17 300)",
  gastronomy: "oklch(0.62 0.18 25)",
  other: "oklch(0.6 0 0)",
};

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-medium">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: DOMAIN_DOT[domain] }}
      />
      {DOMAIN_LABELS[domain]}
    </Badge>
  );
}
