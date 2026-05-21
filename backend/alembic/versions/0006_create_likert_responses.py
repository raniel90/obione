"""create likert responses

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "likert_responses",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("dimension", sa.String(length=64), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("respondent_id", sa.UUID(), nullable=True),
        sa.Column("project_id", sa.UUID(), nullable=True),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "kind IN ('consultoria', 'client')",
            name=op.f("ck_likert_responses_valid_kind"),
        ),
        sa.CheckConstraint(
            "score BETWEEN 1 AND 5",
            name=op.f("ck_likert_responses_score_in_range"),
        ),
        sa.CheckConstraint(
            "(kind = 'consultoria' AND project_id IS NULL) "
            "OR (kind = 'client' AND project_id IS NOT NULL)",
            name=op.f("ck_likert_responses_project_id_matches_kind"),
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_likert_responses_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["respondent_id"],
            ["users.id"],
            name=op.f("fk_likert_responses_respondent_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_likert_responses")),
    )
    op.create_index(op.f("ix_likert_responses_kind"), "likert_responses", ["kind"], unique=False)
    op.create_index(
        op.f("ix_likert_responses_project_id"),
        "likert_responses",
        ["project_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_likert_responses_project_id"), table_name="likert_responses")
    op.drop_index(op.f("ix_likert_responses_kind"), table_name="likert_responses")
    op.drop_table("likert_responses")
