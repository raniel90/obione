"""drop documents context

Removes the documents bounded context end-to-end:
- drops FK + column extractions.document_id (extraction source is now the
  project's description field, with sha256 stored in source_description_hash);
- drops the documents table.

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-30 07:41:55.363980

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # First detach the extractions FK so the documents table can be dropped.
    op.drop_constraint(
        op.f("fk_extractions_document_id_documents"), "extractions", type_="foreignkey"
    )
    op.drop_column("extractions", "document_id")
    op.drop_index(op.f("ix_documents_project_id"), table_name="documents")
    op.drop_table("documents")


def downgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("project_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("original_name", sa.VARCHAR(length=512), autoincrement=False, nullable=False),
        sa.Column("relative_path", sa.VARCHAR(length=512), autoincrement=False, nullable=False),
        sa.Column("sha256", sa.VARCHAR(length=64), autoincrement=False, nullable=False),
        sa.Column("size_bytes", sa.BIGINT(), autoincrement=False, nullable=False),
        sa.Column("mime_type", sa.VARCHAR(length=128), autoincrement=False, nullable=False),
        sa.Column("uploaded_by", sa.UUID(), autoincrement=False, nullable=True),
        sa.Column(
            "uploaded_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_documents_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["uploaded_by"],
            ["users.id"],
            name=op.f("fk_documents_uploaded_by_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_documents")),
        sa.UniqueConstraint("sha256", name=op.f("uq_documents_sha256")),
    )
    op.create_index(op.f("ix_documents_project_id"), "documents", ["project_id"], unique=False)
    op.add_column(
        "extractions",
        sa.Column("document_id", sa.UUID(), autoincrement=False, nullable=True),
    )
    op.create_foreign_key(
        op.f("fk_extractions_document_id_documents"),
        "extractions",
        "documents",
        ["document_id"],
        ["id"],
        ondelete="SET NULL",
    )
