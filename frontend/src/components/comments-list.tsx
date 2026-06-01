import { format, parseISO } from "date-fns";
import type { CommentBrief } from "@/lib/api/types";

export function CommentsList({ comments }: { comments: CommentBrief[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>;
  }
  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        <li key={c.id} className="rounded-md border p-3 text-sm">
          <p className="whitespace-pre-wrap">{c.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {format(parseISO(c.created_at), "dd/MM/yyyy HH:mm")}
          </p>
        </li>
      ))}
    </ul>
  );
}
