"""Resumo do Cliente domain model (US12).

An accessible narrative generated from an MPO extraction. Always lands in
``status='draft'`` so the consultor can review/edit it before publishing.
The client never sees a draft — visibility queries filter by status.

`source_extraction_id` ties the resumo to the extraction it was generated
from, so the dashboard can show "based on extraction X" / regenerate-if-
extraction-updated workflows later.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.shared.database import Base
from obione.shared.ids import new_id


def _now() -> datetime:
    return datetime.now(UTC)


RESUMO_STATUSES = ("draft", "published")


class Resumo(Base):
    __tablename__ = "resumos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_extraction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("extractions.id", ondelete="SET NULL"),
        nullable=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft")
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

    __table_args__ = (CheckConstraint(f"status IN {RESUMO_STATUSES}", name="valid_status"),)
