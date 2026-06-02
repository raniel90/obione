import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { VisibilityAttributeRow } from "./visibility-attribute-row";
import type { CategoryDef } from "@/lib/mpo/catalog";
import type { AttributeVisibilityChoice } from "@/lib/queries/use-set-attribute-override";

interface Props {
  category: CategoryDef;
  categoryVisible: boolean;
  choiceByAttr: Record<string, AttributeVisibilityChoice>;
  resolved: Record<string, boolean>;
  onToggleCategory: (visible: boolean) => void;
  onChangeAttr: (attributeKey: string, choice: AttributeVisibilityChoice) => void;
}

export function VisibilityCategoryRow({
  category,
  categoryVisible,
  choiceByAttr,
  resolved,
  onToggleCategory,
  onChangeAttr,
}: Props) {
  const total = category.attributes.length;
  const visible = category.attributes.filter((a) => resolved[a.key]).length;
  return (
    <Accordion type="single" collapsible defaultValue={category.key} className="rounded-md border px-4">
      <AccordionItem value={category.key} className="border-none">
        <div className="flex items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={categoryVisible}
              onCheckedChange={onToggleCategory}
              aria-label={`Liberar categoria ${category.label}`}
            />
            <span className="font-medium">{category.label}</span>
            <span className="text-xs text-muted-foreground">
              {categoryVisible ? "Liberada" : "Oculta"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {visible}/{total} visíveis
          </span>
        </div>
        <AccordionTrigger className="text-sm text-muted-foreground">Atributos</AccordionTrigger>
        <AccordionContent>
          <dl className="divide-y">
            {category.attributes.map((a) => (
              <VisibilityAttributeRow
                key={a.key}
                attr={a}
                choice={choiceByAttr[a.key]}
                resolved={!!resolved[a.key]}
                onChange={(choice) => onChangeAttr(a.key, choice)}
              />
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
