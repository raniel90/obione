"""Activity feed use case (US11).

Builds an in-memory chronological merge of three event sources scoped to the
projects the calling user is allowed to see:

  - new_comment    when someone comments in a visible project
  - new_extraction when an extraction (llm or manual) is created
  - new_document   when a document is uploaded

No new tables, no caching — sources are queried fresh per request. Volume is
small (5 projects × ~10s of items each) so this is cheap. If the feed grows
hot, the right next step is a denormalized `feed_events` table populated by
service-layer hooks at write-time.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from obione.auth.models import User
from obione.feed.schemas import FeedEvent
from obione.projects.access_control import list_visible_projects
from obione.projects.models import Project
from obione.unit_of_work import AbstractUnitOfWork


@dataclass
class _RawEvent:
    kind: str
    project: Project
    actor_id: object  # uuid or None
    target_id: object
    created_at: datetime
    summary: str


def _trim(text: str, limit: int = 140) -> str:
    text = (text or "").strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def build_feed_for_user(
    uow: AbstractUnitOfWork, user: User, *, limit: int = 50
) -> list[FeedEvent]:
    with uow:
        projects = list_visible_projects(uow, user)
        if not projects:
            return []
        by_id = {p.id: p for p in projects}
        events: list[_RawEvent] = []

        for project in projects:
            for c in uow.comments.list_by_project(project.id):
                events.append(_RawEvent(
                    kind="new_comment",
                    project=project,
                    actor_id=c.author_id,
                    target_id=c.id,
                    created_at=c.created_at,
                    summary=_trim(c.body),
                ))
            for e in uow.extractions.list_by_project(project.id):
                summary = (
                    f"Nova extração via {e.llm_model}" if e.source == "llm"
                    else "Nova extração (entrada manual)"
                )
                events.append(_RawEvent(
                    kind="new_extraction",
                    project=project,
                    actor_id=e.created_by,
                    target_id=e.id,
                    created_at=e.created_at,
                    summary=summary,
                ))
            for d in uow.documents.list_by_project(project.id):
                events.append(_RawEvent(
                    kind="new_document",
                    project=project,
                    actor_id=d.uploaded_by,
                    target_id=d.id,
                    created_at=d.uploaded_at,
                    summary=f"Documento anexado: {d.original_name}",
                ))

        events.sort(key=lambda e: e.created_at, reverse=True)
        events = events[:limit]
        return [
            FeedEvent(
                kind=e.kind,  # type: ignore[arg-type]
                project_id=e.project.id,
                project_name=by_id[e.project.id].name,
                actor_id=e.actor_id,
                target_id=e.target_id,
                created_at=e.created_at,
                summary=e.summary,
            )
            for e in events
        ]
