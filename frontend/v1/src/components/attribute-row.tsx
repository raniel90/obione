import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PORTE_LABELS, STATUS_CRONOGRAMA_LABELS } from "@/lib/mpo/catalog";
import type { GroupedAttribute } from "@/lib/mpo/group-attributes";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function renderValue(attr: GroupedAttribute): ReactNode {
  if (attr.renderType === "out_of_scope") {
    return <span className="italic text-muted-foreground">(fora de escopo)</span>;
  }
  const v = attr.value;
  const dash = <span className="text-muted-foreground">—</span>;
  if (v == null) return dash;

  switch (attr.renderType) {
    case "date":
      return <span>{format(parseISO(String(v)), "dd/MM/yyyy")}</span>;
    case "currency":
      return <span>{BRL.format(Number(v))}</span>;
    case "array": {
      const arr = v as unknown[];
      if (arr.length === 0) return dash;
      return (
        <span className="flex flex-wrap gap-1">
          {arr.map((x, i) => (
            <Badge key={i} variant="outline">
              {String(x)}
            </Badge>
          ))}
        </span>
      );
    }
    case "enum_porte":
      return <span>{PORTE_LABELS[String(v)] ?? String(v)}</span>;
    case "enum_status":
      return <span>{STATUS_CRONOGRAMA_LABELS[String(v)] ?? String(v)}</span>;
    default:
      return <span className="whitespace-pre-wrap">{String(v)}</span>;
  }
}

export function AttributeRow({ attr }: { attr: GroupedAttribute }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{attr.label}</dt>
      <dd className="text-sm">{renderValue(attr)}</dd>
    </div>
  );
}
