import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { DraftForm } from "./draft-form";
import type { Draft, DraftStatus } from "@/lib/api/types";

const STATUS_LABELS: Record<DraftStatus, string> = { draft: "rascunho", published: "publicado" };

interface Props {
  draft: Draft;
  canAuthor: boolean;
  onEdit: (patch: { title: string; body: string }) => void | Promise<unknown>;
  onPublish: () => void;
  onDelete: () => void;
  pending?: boolean;
}

export function DraftItem({ draft, canAuthor, onEdit, onPublish, onDelete, pending }: Props) {
  const [editing, setEditing] = useState(false);
  const editable = canAuthor && draft.status === "draft";

  if (editing) {
    return (
      <li className="rounded-md border p-3 text-sm">
        <DraftForm
          defaultTitle={draft.title ?? ""}
          defaultBody={draft.body}
          pending={pending}
          onSubmit={(patch) => {
            const result = onEdit(patch);
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
      <div className="mb-1 flex items-center justify-between gap-2">
        {draft.title ? <span className="font-medium">{draft.title}</span> : <span />}
        <Badge variant={draft.status === "published" ? "default" : "secondary"}>
          {STATUS_LABELS[draft.status]}
        </Badge>
      </div>
      <p className="whitespace-pre-wrap text-muted-foreground">{draft.body}</p>
      {editable && (
        <div className="mt-2 flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                Publicar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publicar draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  Fica visível ao cliente e não pode mais ser editado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onPublish}>Publicar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                Descartar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Descartar draft?</AlertDialogTitle>
                <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Descartar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </li>
  );
}
