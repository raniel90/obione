import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { useComments } from "@/lib/queries/use-comments";
import { useCreateComment } from "@/lib/queries/use-create-comment";
import { useUpdateComment } from "@/lib/queries/use-update-comment";
import { useDeleteComment } from "@/lib/queries/use-delete-comment";

interface Props {
  projectId: string;
  currentUserId: string;
  canModerate: boolean;
}

export function CommentsSection({ projectId, currentUserId, canModerate }: Props) {
  const commentsQ = useComments(projectId);
  const createMutation = useCreateComment(projectId);
  const updateMutation = useUpdateComment(projectId);
  const deleteMutation = useDeleteComment(projectId);

  function handleCreate(body: string) {
    createMutation.mutate(body, {
      onSuccess: () => toast.success("Comentário publicado"),
      onError: () => toast.error("Não foi possível publicar o comentário."),
    });
  }
  function handleUpdate(commentId: string, body: string) {
    // Devolve a promise pra o CommentItem fechar o modo de edição só no sucesso.
    return updateMutation.mutateAsync(
      { commentId, body },
      {
        onSuccess: () => toast.success("Comentário atualizado"),
        onError: () => toast.error("Não foi possível atualizar o comentário."),
      },
    );
  }
  function handleDelete(commentId: string) {
    deleteMutation.mutate(commentId, {
      onSuccess: () => toast.success("Comentário excluído"),
      onError: () => toast.error("Não foi possível excluir o comentário."),
    });
  }

  const comments = commentsQ.data ?? [];

  return (
    <div className="space-y-4">
      {commentsQ.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : commentsQ.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="mb-2 text-destructive">Erro ao carregar comentários.</p>
          <Button variant="outline" size="sm" onClick={() => commentsQ.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              canEdit={c.author_id === currentUserId}
              canDelete={c.author_id === currentUserId || canModerate}
              onEdit={(body) => handleUpdate(c.id, body)}
              onDelete={() => handleDelete(c.id)}
              pending={updateMutation.isPending || deleteMutation.isPending}
            />
          ))}
        </ul>
      )}

      <CommentForm onSubmit={handleCreate} pending={createMutation.isPending} />
    </div>
  );
}
