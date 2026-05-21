"""create resumos

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "resumos",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("source_extraction_id", sa.UUID(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("llm_model", sa.String(length=128), nullable=True),
        sa.Column("generated_by", sa.UUID(), nullable=True),
        sa.Column("reviewed_by", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'published')",
            name=op.f("ck_resumos_valid_status"),
        ),
        sa.ForeignKeyConstraint(
            ["generated_by"],
            ["users.id"],
            name=op.f("fk_resumos_generated_by_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_resumos_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by"],
            ["users.id"],
            name=op.f("fk_resumos_reviewed_by_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["source_extraction_id"],
            ["extractions.id"],
            name=op.f("fk_resumos_source_extraction_id_extractions"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_resumos")),
    )
    op.create_index(op.f("ix_resumos_project_id"), "resumos", ["project_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_resumos_project_id"), table_name="resumos")
    op.drop_table("resumos")
