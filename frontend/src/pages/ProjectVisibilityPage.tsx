import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useVisibility } from "@/lib/queries/use-visibility";
import { useSetCategoryVisibility } from "@/lib/queries/use-set-category-visibility";
import { useSetAttributeOverride } from "@/lib/queries/use-set-attribute-override";
import type { AttributeVisibilityChoice } from "@/lib/queries/use-set-attribute-override";
import { VisibilityCategoryRow } from "@/components/visibility-category-row";
import { CATEGORIES } from "@/lib/mpo/catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const TOTAL = CATEGORIES.reduce((n, c) => n + c.attributes.length, 0);

export function ProjectVisibilityPage() {
  const { id = "" } = useParams<{ id: string }>();
  const stateQ = useVisibility(id);
  const setCategory = useSetCategoryVisibility(id);
  const setAttr = useSetAttributeOverride(id);

  if (stateQ.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (stateQ.isError) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="mb-3 text-destructive">Erro ao carregar a visibilidade.</p>
        <Button variant="outline" size="sm" onClick={() => stateQ.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const state = stateQ.data!;
  const categoryVisible = (key: string) =>
    state.categories.find((c) => c.category_key === key)?.visible ?? false;
  const overrideMap = new Map(state.overrides.map((o) => [o.attribute_key, o.visible]));
  const choiceOf = (attrKey: string): AttributeVisibilityChoice =>
    overrideMap.has(attrKey) ? (overrideMap.get(attrKey) ? "visible" : "hidden") : "inherit";
  const visibleCount = Object.values(state.resolved).filter(Boolean).length;

  function handleToggleCategory(categoryKey: string, visible: boolean) {
    setCategory.mutate(
      { categoryKey, visible },
      {
        onSuccess: () => toast.success("Visibilidade atualizada"),
        onError: () => toast.error("Não foi possível atualizar a visibilidade."),
      },
    );
  }

  function handleChangeAttr(attributeKey: string, choice: AttributeVisibilityChoice) {
    setAttr.mutate(
      { attributeKey, choice },
      {
        onSuccess: () => toast.success("Visibilidade atualizada"),
        onError: () => toast.error("Não foi possível atualizar a visibilidade."),
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <Link to={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Detalhe do projeto
        </Link>
        <h1 className="text-2xl font-bold">Visibilidade do cliente</h1>
        <p className="text-sm text-muted-foreground">
          Cliente vê {visibleCount} de {TOTAL} atributos.
        </p>
      </header>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const choiceByAttr: Record<string, AttributeVisibilityChoice> = {};
          for (const a of cat.attributes) choiceByAttr[a.key] = choiceOf(a.key);
          return (
            <VisibilityCategoryRow
              key={cat.key}
              category={cat}
              categoryVisible={categoryVisible(cat.key)}
              choiceByAttr={choiceByAttr}
              resolved={state.resolved}
              onToggleCategory={(visible) => handleToggleCategory(cat.key, visible)}
              onChangeAttr={handleChangeAttr}
            />
          );
        })}
      </div>
    </div>
  );
}
