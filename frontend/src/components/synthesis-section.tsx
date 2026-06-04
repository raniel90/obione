import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SynthesisItem } from "./synthesis-item";
import { useSyntheses } from "@/lib/queries/use-syntheses";
import { useProjectSyntheses } from "@/lib/queries/use-project-syntheses";
import { useGenerateSynthesis } from "@/lib/queries/use-generate-synthesis";
import { useUpdateSynthesis } from "@/lib/queries/use-update-synthesis";
import { useDeleteSynthesis } from "@/lib/queries/use-delete-synthesis";
import { usePublishSynthesis } from "@/lib/queries/use-publish-synthesis";

interface Props {
  canAuthor: boolean;
  /** Staff (cockpit): manage the syntheses of this temática. */
  domain?: string;
  /** Read (detail): published syntheses of this project's temática. */
  projectId?: string;
}

/**
 * The Conectora UI — mirrors DraftsSection but at the temática level. With
 * `domain` + `canAuthor`, staff generate/edit/publish/discard. With
 * `projectId` (canAuthor=false), anyone seeing the project reads the
 * published syntheses of its temática.
 */
export function SynthesisSection({ canAuthor, domain, projectId }: Props) {
  const byDomain = useSyntheses(domain ?? "");
  const byProject = useProjectSyntheses(projectId ?? "");
  const q = domain ? byDomain : byProject;

  const generateMutation = useGenerateSynthesis(domain ?? "");
  const updateMutation = useUpdateSynthesis();
  const deleteMutation = useDeleteSynthesis();
  const publishMutation = usePublishSynthesis();

  function handleGenerate() {
    generateMutation.mutate(undefined, {
      onSuccess: () => toast.success("Síntese gerada"),
      onError: () =>
        toast.error("Não foi possível gerar (a temática precisa de projetos com extração)."),
    });
  }
  function handleUpdate(id: string, patch: { title: string; body: string }) {
    return updateMutation.mutateAsync(
      { id, patch },
      {
        onSuccess: () => toast.success("Síntese atualizada"),
        onError: () => toast.error("Não foi possível atualizar a síntese."),
      },
    );
  }
  function handlePublish(id: string) {
    publishMutation.mutate(id, {
      onSuccess: () => toast.success("Síntese publicada"),
      onError: () => toast.error("Não foi possível publicar a síntese."),
    });
  }
  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Síntese descartada"),
      onError: () => toast.error("Não foi possível descartar a síntese."),
    });
  }

  const items = q.data ?? [];
  const pending = updateMutation.isPending || deleteMutation.isPending || publishMutation.isPending;

  return (
    <div className="space-y-3">
      {canAuthor && domain && (
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={generateMutation.isPending} size="sm">
            <Sparkles className="size-4" />
            {generateMutation.isPending ? "Gerando…" : "Gerar com IA"}
          </Button>
        </div>
      )}

      {q.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : q.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="mb-2 text-destructive">Erro ao carregar as sínteses.</p>
          <Button variant="outline" size="sm" onClick={() => q.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {canAuthor
            ? "Nenhuma síntese ainda — gere com a IA a partir dos projetos da temática."
            : "Nenhuma síntese publicada para esta temática ainda."}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <SynthesisItem
              key={s.id}
              synthesis={s}
              canAuthor={canAuthor}
              onEdit={(patch) => handleUpdate(s.id, patch)}
              onPublish={() => handlePublish(s.id)}
              onDelete={() => handleDelete(s.id)}
              pending={pending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
