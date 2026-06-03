import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { FileText, MessageSquare } from "lucide-react";
import type { FeedEvent } from "@/lib/api/types";

export function FeedEventItem({ event }: { event: FeedEvent }) {
  const Icon = event.kind === "new_comment" ? MessageSquare : FileText;
  return (
    <li>
      <Link
        to={`/projects/${event.project_id}`}
        className="flex items-start gap-3 rounded-md border p-3 text-sm hover:bg-muted/50"
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
