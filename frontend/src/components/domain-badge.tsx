import { Badge } from "@/components/ui/badge";
import { DOMAIN_LABELS } from "@/lib/mpo/catalog";
import type { Domain } from "@/lib/api/types";

export function DomainBadge({ domain }: { domain: Domain }) {
  return <Badge variant="secondary">{DOMAIN_LABELS[domain]}</Badge>;
}
