"""extractions add source description hash

Adds the SHA-256 hash of the project.description used as input for the LLM
extraction. Nullable for now to support old rows (whose source was a docx
upload); tightened to NOT NULL later when the documents/ context is removed
and all extractions descend from project.description.

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-29 23:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "extractions",
        sa.Column("source_description_hash", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("extractions", "source_description_hash")
