"""CBAC tables: which MPO categories/attributes the client sees per project.

The two tables work together with the rule: an attribute's visibility is
resolved as `override (if any) → category default (if any) → False (default
oculto, privacy by default)`. Service layer keeps the resolution lookup so
the DB-level CHECK constraints only enforce key validity, not policy.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.extractions.coverage import all_attributes, all_categories
from obione.shared.database import Base

_CAT_LIST = ", ".join(f"'{c}'" for c in all_categories())
_ATTR_LIST = ", ".join(f"'{a}'" for a in all_attributes())


class ProjectCategoryVisibility(Base):
    __tablename__ = "project_category_visibility"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    )
    category_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    visible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (CheckConstraint(f"category_key IN ({_CAT_LIST})", name="valid_category_key"),)


class ProjectAttributeVisibility(Base):
    __tablename__ = "project_attribute_visibility"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    )
    attribute_key: Mapped[str] = mapped_column(String(128), primary_key=True)
    visible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(f"attribute_key IN ({_ATTR_LIST})", name="valid_attribute_key"),
    )
