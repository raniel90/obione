"""Project export use case (US18 backend slice).

Builds a single JSON bundle with everything a researcher needs to feed the
Sprint 5 evaluation pipeline: project metadata, documents (no blob bytes —
just metadata + hash), all extractions (any source), all comments, and the
coverage report computed from the latest extraction.

CSV variants and Likert/Kappa columns ship in Sprint 5 along with US15-US17.
"""
from __future__ import annotations

import uuid
from dataclasses import asdict, is_dataclass
from datetime import datetime, timezone
from typing import Any

from obione.auth.models import User
from obione.extractions.coverage import compute_coverage
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def _to_jsonable(v: Any) -> Any:
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, uuid.UUID):
        return str(v)
    if is_dataclass(v):
        return {k: _to_jsonable(x) for k, x in asdict(v).items()}
    if isinstance(v, list):
        return [_to_jsonable(x) for x in v]
    if isinstance(v, dict):
        return {k: _to_jsonable(x) for k, x in v.items()}
    return v


def export_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> dict:
    project = get_project_for_user(uow, user, project_id)
    with uow:
        documents = uow.documents.list_by_project(project.id)
        extractions = uow.extractions.list_by_project(project.id)
        comments = uow.comments.list_by_project(project.id)
        latest_extraction = extractions[0] if extractions else None
        coverage = compute_coverage(
            latest_extraction.content if latest_extraction else {},
            extraction_id=str(latest_extraction.id) if latest_extraction else None,
        )

    return _to_jsonable({
        "schema_version": "1.0",
        "exported_at": datetime.now(tz=timezone.utc).isoformat(),
        "exported_by": user.id,
        "project": {
            "id": project.id,
            "name": project.name,
            "domain": project.domain,
            "description": project.description,
            "consultant_id": project.consultant_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        },
        "documents": [
            {
                "id": d.id,
                "original_name": d.original_name,
                "sha256": d.sha256,
                "size_bytes": d.size_bytes,
                "mime_type": d.mime_type,
                "uploaded_by": d.uploaded_by,
                "uploaded_at": d.uploaded_at,
            }
            for d in documents
        ],
        "extractions": [
            {
                "id": e.id,
                "document_id": e.document_id,
                "source": e.source,
                "llm_model": e.llm_model,
                "content": e.content,
                "created_by": e.created_by,
                "created_at": e.created_at,
            }
            for e in extractions
        ],
        "comments": [
            {
                "id": c.id,
                "author_id": c.author_id,
                "parent_id": c.parent_id,
                "body": c.body,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
            }
            for c in comments
        ],
        "coverage": {
            "extraction_id": coverage.extraction_id,
            "filled": coverage.filled,
            "total_in_scope": coverage.total_in_scope,
            "out_of_scope_count": coverage.out_of_scope_count,
            "percentage": coverage.percentage,
            "by_category": [
                {
                    "category": c.category,
                    "filled": c.filled,
                    "total_in_scope": c.total_in_scope,
                    "percentage": c.percentage,
                }
                for c in coverage.by_category
            ],
        },
    })
