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
import type { Synthesis, SynthesisStatus } from "@/lib/api/types";

const STATUS_LABELS: Record<SynthesisStatus, string> = {
  draft: "rascunho",
  published: "publicado",
};

/** Lightweight renderer for the synthesis body (## headings + - bullets). */
function SynthesisBody({ body }: { body: string }) {
  const lines = body.split("\n");
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {lines.map((line, i) => {
        const key = `${i}-${line.slice(0, 8)}`;
        if (line.startsWith("## ")) {
          return (
            <p key={key} className="mt-2 font-medium text-foreground">
              {line.slice(3)}
            </p>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={key} className="pl-4">
              • {line.slice(2)}
            </p>
          );
        }
        if (line.trim() === "") return <div key={key} className="h-1" />;
        return <p key={key}>{line}</p>;
      })}
    </div>
  );
}

interface Props {
  synthesis: Synthesis;
  canAuthor: boolean;
  onEdit: (patch: { title: string; body: string }) => void | Promise<unknown>;
  onPublish: () => void;
  onDelete: () => void;
  pending?: boolean;
}

export function SynthesisItem({
  synthesis,
  canAuthor,
  onEdit,
  onPublish,
  onDelete,
  pending,
}: Props) {
  const [editing, setEditing] = useState(false);
  const editable = canAuthor && synthesis.status === "draft";

  if (editing) {
    return (
      <li className="rounded-md border p-3 text-sm">
        <DraftForm
          defaultTitle={synthesis.title ?? ""}
          defaultBody={synthesis.body}
          maxBody={8000}
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
        {synthesis.title ? <span className="font-medium">{synthesis.title}</span> : <span />}
        <Badge variant={synthesis.status === "published" ? "default" : "secondary"}>
          {STATUS_LABELS[synthesis.status]}
        </Badge>
      </div>
      <SynthesisBody body={synthesis.body} />
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
                <AlertDialogTitle>Publicar síntese?</AlertDialogTitle>
                <AlertDialogDescription>
                  Fica visível aos clientes do domínio e não pode mais ser editada.
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
                <AlertDialogTitle>Descartar síntese?</AlertDialogTitle>
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
