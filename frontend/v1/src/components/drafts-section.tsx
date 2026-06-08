import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DraftItem } from "./draft-item";
import { useDrafts } from "@/lib/queries/use-drafts";
import { useGenerateDrafts } from "@/lib/queries/use-generate-drafts";
import { useUpdateDraft } from "@/lib/queries/use-update-draft";
import { useDeleteDraft } from "@/lib/queries/use-delete-draft";
import { usePublishDraft } from "@/lib/queries/use-publish-draft";
import type { DraftKind } from "@/lib/api/types";

const KIND_LABELS: Record<DraftKind, string> = {
  next_step: "Próximos Passos",
  attention_point: "Pontos de Atenção",
};
const KIND_ORDER: DraftKind[] = ["next_step", "attention_point"];

interface Props {
  projectId: string;
  canAuthor: boolean;
}

export function DraftsSection({ projectId, canAuthor }: Props) {
  const draftsQ = useDrafts(projectId);
  const generateMutation = useGenerateDrafts(projectId);
  const updateMutation = useUpdateDraft(projectId);
  const deleteMutation = useDeleteDraft(projectId);
  const publishMutation = usePublishDraft(projectId);

  function handleGenerate() {
    generateMutation.mutate(undefined, {
      onSuccess: () => toast.success("Drafts gerados"),
      onError: () => toast.error("Não foi possível gerar (o projeto precisa de extração)."),
    });
  }
  function handleUpdate(draftId: string, patch: { title: string; body: string }) {
    return updateMutation.mutateAsync(
      { draftId, patch: { title: patch.title, body: patch.body } },
      {
        onSuccess: () => toast.success("Draft atualizado"),
        onError: () => toast.error("Não foi possível atualizar o draft."),
      },
    );
  }
  function handlePublish(draftId: string) {
    publishMutation.mutate(draftId, {
      onSuccess: () => toast.success("Draft publicado"),
      onError: () => toast.error("Não foi possível publicar o draft."),
    });
  }
  function handleDelete(draftId: string) {
    deleteMutation.mutate(draftId, {
      onSuccess: () => toast.success("Draft descartado"),
      onError: () => toast.error("Não foi possível descartar o draft."),
    });
  }

  const drafts = draftsQ.data ?? [];
  const pending = updateMutation.isPending || deleteMutation.isPending || publishMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Próximos Passos &amp; Pontos de Atenção</h2>
        {canAuthor && (
          <Button onClick={handleGenerate} disabled={generateMutation.isPending} size="sm">
            {generateMutation.isPending ? "Gerando…" : "Gerar com IA"}
          </Button>
        )}
      </div>

      {draftsQ.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : draftsQ.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="mb-2 text-destructive">Erro ao carregar os drafts.</p>
          <Button variant="outline" size="sm" onClick={() => draftsQ.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : drafts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {canAuthor
            ? "Nenhum draft ainda — gere com a IA."
            : "Nenhuma orientação publicada ainda."}
        </p>
      ) : (
        <div className="space-y-4">
          {KIND_ORDER.map((kind) => {
            const items = drafts.filter((d) => d.kind === kind);
            if (items.length === 0) return null;
            return (
              <div key={kind} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{KIND_LABELS[kind]}</h3>
                <ul className="space-y-2">
                  {items.map((d) => (
                    <DraftItem
                      key={d.id}
                      draft={d}
                      canAuthor={canAuthor}
                      onEdit={(patch) => handleUpdate(d.id, patch)}
                      onPublish={() => handlePublish(d.id)}
                      onDelete={() => handleDelete(d.id)}
                      pending={pending}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
