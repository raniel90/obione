"""drop resumos context

Removes the resumos bounded context. The Resumo do Cliente (RF12) is
substituted by CBAC: the client sees the released attributes directly,
without a generated narrative summary in between.

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-30 10:37:36.453447

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index(op.f("ix_resumos_project_id"), table_name="resumos")
    op.drop_table("resumos")


def downgrade() -> None:
    op.create_table(
        "resumos",
        sa.Column("id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("project_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("source_extraction_id", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column("body", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("status", sa.VARCHAR(length=16), autoincrement=False, nullable=False),
        sa.Column("llm_model", sa.VARCHAR(length=128), autoincrement=False, nullable=True),
        sa.Column("generated_by", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column("reviewed_by", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column(
            "reviewed_at",
            postgresql.TIMESTAMP(timezone=True),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.CheckConstraint(
            "status::text = ANY (ARRAY['draft'::character varying, "
            "'published'::character varying]::text[])",
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
