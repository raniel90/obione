"""Document repository (abstract + SqlAlchemy + Fake)."""
from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.documents.models import Document


class AbstractDocumentRepository(Protocol):
    def add(self, document: Document) -> None: ...
    def get(self, document_id: uuid.UUID) -> Document | None: ...
    def get_by_sha(self, sha: str) -> Document | None: ...
    def list_by_project(self, project_id: uuid.UUID) -> list[Document]: ...


class SqlAlchemyDocumentRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, document: Document) -> None:
        self._session.add(document)

    def get(self, document_id: uuid.UUID) -> Document | None:
        return self._session.get(Document, document_id)

    def get_by_sha(self, sha: str) -> Document | None:
        return self._session.execute(
            select(Document).where(Document.sha256 == sha)
        ).scalar_one_or_none()

    def list_by_project(self, project_id: uuid.UUID) -> list[Document]:
        return list(
            self._session.execute(
                select(Document)
                .where(Document.project_id == project_id)
                .order_by(Document.uploaded_at.desc())
            ).scalars()
        )


class FakeDocumentRepository:
    def __init__(self):
        self._docs: dict[uuid.UUID, Document] = {}

    def add(self, document: Document) -> None:
        if document.id is None:
            from obione.shared.ids import new_id
            document.id = new_id()
        self._docs[document.id] = document

    def get(self, document_id: uuid.UUID) -> Document | None:
        return self._docs.get(document_id)

    def get_by_sha(self, sha: str) -> Document | None:
        return next((d for d in self._docs.values() if d.sha256 == sha), None)

    def list_by_project(self, project_id: uuid.UUID) -> list[Document]:
        return [d for d in self._docs.values() if d.project_id == project_id]
