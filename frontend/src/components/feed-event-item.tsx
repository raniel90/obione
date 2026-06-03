import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { FileText, MessageSquare } from "lucide-react";
import type { FeedEvent } from "@/lib/api/types";

export function FeedEventItem({ event }: { event: FeedEvent }) {
  const isComment = event.kind === "new_comment";
  const Icon = isComment ? MessageSquare : FileText;
  return (
    <li>
      <Link
        to={`/projects/${event.project_id}`}
        className="flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:border-foreground/20 hover:bg-muted/50"
      >
        <span
          aria-hidden
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
            isComment ? "bg-info/10 text-info" : "bg-success/10 text-success"
          }`}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p>
            <span className="font-medium">{event.project_name}</span>{" "}
            <span className="text-muted-foreground">{event.summary}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {format(parseISO(event.created_at), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
      </Link>
    </li>
  );
}
