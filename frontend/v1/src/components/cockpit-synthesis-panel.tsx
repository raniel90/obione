import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SynthesisSection } from "./synthesis-section";
import { DOMAIN_LABELS } from "@/lib/mpo/catalog";
import type { Domain } from "@/lib/api/types";

/**
 * Staff panel for the Conectora on the cockpit: pick a temática and manage its
 * syntheses (generate / review / publish / discard). One panel keeps the
 * cockpit compact instead of stacking a section per domain.
 */
export function CockpitSynthesisPanel({ domains }: { domains: Domain[] }) {
  const [selected, setSelected] = useState<Domain>(domains[0] ?? "other");
  if (domains.length === 0) return null;

  return (
    <div className="space-y-3">
      <Select value={selected} onValueChange={(v) => setSelected(v as Domain)}>
        <SelectTrigger className="sm:w-56" aria-label="Domínio">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {domains.map((d) => (
            <SelectItem key={d} value={d}>
              {DOMAIN_LABELS[d]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SynthesisSection domain={selected} canAuthor />
    </div>
  );
}
