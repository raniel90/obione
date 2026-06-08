"""Likert response domain model (US16 consultoria + US17 clientes).

One row per (respondent × dimension). The 4 dimensions per kind live in
schemas as `Literal`s so adding/removing a dimension is a single source
of truth change.

Kind="consultoria" → project_id is NULL (consultancy-wide feedback).
Kind="client"      → project_id REQUIRED (feedback is per-project).
A DB CHECK constraint enforces this so callers can't smuggle bad rows in.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.shared.database import Base
from obione.shared.ids import new_id


def _now() -> datetime:
    return datetime.now(UTC)


LIKERT_KINDS = ("consultoria", "client")


class LikertResponse(Base):
    __tablename__ = "likert_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    kind: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    dimension: Mapped[str] = mapped_column(String(64), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    respondent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_now,
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(f"kind IN {LIKERT_KINDS}", name="valid_kind"),
        CheckConstraint("score BETWEEN 1 AND 5", name="score_in_range"),
        CheckConstraint(
            "(kind = 'consultoria' AND project_id IS NULL) "
            "OR (kind = 'client' AND project_id IS NOT NULL)",
            name="project_id_matches_kind",
        ),
    )
