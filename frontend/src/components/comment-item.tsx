import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CommentForm } from "./comment-form";
import type { Comment } from "@/lib/api/types";

interface Props {
  comment: Comment;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (body: string) => void | Promise<unknown>;
  onDelete: () => void;
  pending?: boolean;
}

export function CommentItem({ comment, canEdit, canDelete, onEdit, onDelete, pending }: Props) {
  const [editing, setEditing] = useState(false);
  const edited = comment.updated_at !== comment.created_at;

  if (editing) {
    return (
      <li className="rounded-md border p-3 text-sm">
        <CommentForm
          defaultValue={comment.body}
          submitLabel="Salvar"
          pending={pending}
          onSubmit={(body) => {
            // Fecha o modo de edição só no sucesso; em erro o form continua
            // aberto com o texto digitado (o CommentForm não reseta ao editar).
            const result = onEdit(body);
            if (result instanceof Promise) {
              result.then(() => setEditing(false)).catch(() => {});
            } else {
              setEditing(false);
            }
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="rounded-md border p-3 text-sm">
      <p className="whitespace-pre-wrap">{comment.body}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {format(parseISO(comment.created_at), "dd/MM/yyyy HH:mm")}
          {edited ? " (editado)" : ""}
        </p>
        <div className="flex items-center gap-1">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </li>
  );
}
