"""create drafts

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "drafts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("source_extraction_id", sa.UUID(), nullable=True),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
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
            "kind IN ('next_step', 'attention_point')",
            name=op.f("ck_drafts_valid_kind"),
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'published')",
            name=op.f("ck_drafts_valid_status"),
        ),
        sa.ForeignKeyConstraint(
            ["generated_by"],
            ["users.id"],
            name=op.f("fk_drafts_generated_by_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_drafts_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by"],
            ["users.id"],
            name=op.f("fk_drafts_reviewed_by_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["source_extraction_id"],
            ["extractions.id"],
            name=op.f("fk_drafts_source_extraction_id_extractions"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_drafts")),
    )
    op.create_index(op.f("ix_drafts_kind"), "drafts", ["kind"], unique=False)
    op.create_index(op.f("ix_drafts_project_id"), "drafts", ["project_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_drafts_project_id"), table_name="drafts")
    op.drop_index(op.f("ix_drafts_kind"), table_name="drafts")
    op.drop_table("drafts")
