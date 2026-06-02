import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AttributeDef } from "@/lib/mpo/catalog";
import type { AttributeVisibilityChoice } from "@/lib/queries/use-set-attribute-override";

interface Props {
  attr: AttributeDef;
  choice: AttributeVisibilityChoice;
  resolved: boolean;
  onChange: (choice: AttributeVisibilityChoice) => void;
}

export function VisibilityAttributeRow({ attr, choice, resolved, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span>{attr.label}</span>
        {attr.outOfScope && (
          <span className="text-xs text-muted-foreground">(fora de escopo)</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          value={choice}
          onValueChange={(v) => v && onChange(v as AttributeVisibilityChoice)}
          aria-label={`Visibilidade de ${attr.label}`}
        >
          <ToggleGroupItem value="inherit">Herda</ToggleGroupItem>
          <ToggleGroupItem value="visible">Liberado</ToggleGroupItem>
          <ToggleGroupItem value="hidden">Oculto</ToggleGroupItem>
        </ToggleGroup>
        <span className="w-14 text-right text-xs text-muted-foreground">
          {resolved ? "visível" : "oculto"}
        </span>
      </div>
    </div>
  );
}
