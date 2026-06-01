import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AttributeRow } from "./attribute-row";
import type { GroupedCategory } from "@/lib/mpo/group-attributes";
import type { CategoryCoverage } from "@/lib/mpo/coverage";

interface Props {
  categories: GroupedCategory[];
  coverageByCategory?: Record<string, CategoryCoverage>;
}

export function AttributeAccordion({ categories, coverageByCategory }: Props) {
  return (
    <Accordion type="multiple" defaultValue={categories.map((c) => c.key)}>
      {categories.map((cat) => {
        const cov = coverageByCategory?.[cat.key];
        return (
          <AccordionItem key={cat.key} value={cat.key}>
            <AccordionTrigger>
              <span className="flex w-full items-center justify-between pr-2">
                <span>
                  {cat.label} ({cat.attributes.length})
                </span>
                {cov && <span className="text-xs text-muted-foreground">{cov.percentage}%</span>}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <dl className="divide-y">
                {cat.attributes.map((a) => (
                  <AttributeRow key={a.key} attr={a} />
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
