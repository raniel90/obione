"""project description required and text

Backfills existing rows where description is NULL or empty (uses name as
fallback so the NOT NULL constraint can be applied), then alters the column
to NOT NULL.

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-29 23:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Backfill: existing projects without description borrow the name so the
    # NOT NULL transition succeeds. New projects will require explicit input
    # via ProjectCreate (min_length=200) at the API layer.
    op.execute(
        "UPDATE projects SET description = name WHERE description IS NULL OR description = ''"
    )
    op.alter_column(
        "projects",
        "description",
        existing_type=sa.TEXT(),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "projects",
        "description",
        existing_type=sa.TEXT(),
        nullable=True,
    )
