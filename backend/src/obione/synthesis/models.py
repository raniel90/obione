"""Synthesis domain model — the "Conectora" (MPO "Combinar").

A Synthesis is a thematic, cross-project digest: for one temática (domain),
the IA distils recurring patterns, common risks and best practices from the
projects of that theme. It follows the same lifecycle as Drafts
(draft → published; published is immutable). The body is consultor-reviewed
and anonymised (no client/project names) before publication.

Keyed by `domain`, not by a single project — provenance is kept in
`source_project_ids`.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.projects.models import PROJECT_DOMAINS
from obione.shared.database import Base
from obione.shared.ids import new_id


def _now() -> datetime:
    return datetime.now(UTC)


SYNTHESIS_STATUSES = ("draft", "published")


class Synthesis(Base):
    __tablename__ = "syntheses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    domain: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft")
    source_project_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    llm_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    generated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_now,
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_now,
        onupdate=_now,
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(f"domain IN {PROJECT_DOMAINS}", name="valid_domain"),
        CheckConstraint(f"status IN {SYNTHESIS_STATUSES}", name="valid_status"),
    )
