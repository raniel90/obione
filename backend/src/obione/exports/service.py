"""Project export use cases (US18 backend slice).

`export_project` returns the JSON bundle with everything a researcher needs
to feed the Sprint 5 evaluation pipeline: project metadata, all extractions
(any source), all comments, and the coverage report from the latest
extraction.

`export_project_attributes_csv` returns a "long" CSV — one row per
(extraction × attribute) — which is the format the academic protocol
(`atividades/protocolo_avaliacao.md`) feeds to the two-evaluator rubric
work. Likert and Kappa columns ship later (US16-US17).
"""

from __future__ import annotations

import csv
import io
import uuid
from dataclasses import asdict, is_dataclass
from datetime import UTC, datetime
from typing import Any

from obione.auth.models import User
from obione.extractions.coverage import attribute_specs, compute_coverage
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


_CSV_COLUMNS = (
    "project_id",
    "project_name",
    "extraction_id",
    "extraction_source",
    "extraction_llm_model",
    "extraction_created_at",
    "attribute_name",
    "attribute_category",
    "attribute_type",
    "attribute_out_of_scope",
    "attribute_value",
)


def _csv_value(raw: Any) -> str:
    """Render an attribute value as a single CSV cell.

    Lists are joined with `; ` so the cell stays atomic (avoids embedded
    delimiters that would confuse simplistic CSV consumers like spreadsheets).
    Dicts are rejected — the schema doesn't have any nested object attrs.
    """
    if raw is None:
        return ""
    if isinstance(raw, list):
        return "; ".join(str(x) for x in raw if x is not None)
    if isinstance(raw, dict):
        return ""  # not expected on the 44 attrs; defensive
    return str(raw)


def export_project_attributes_csv(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> str:
    """Long CSV: one row per (extraction × attribute).

    Includes every extraction of the project (llm + manual), each of the 44
    attributes. The `_meta` block is not emitted as attribute rows —
    provenance is in the extraction columns.
    """
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extractions = uow.extractions.list_by_project(project.id)
    specs = attribute_specs()

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=_CSV_COLUMNS)
    writer.writeheader()
    for extraction in extractions:
        for spec in specs:
            writer.writerow(
                {
                    "project_id": str(project.id),
                    "project_name": project.name,
                    "extraction_id": str(extraction.id),
                    "extraction_source": extraction.source,
                    "extraction_llm_model": extraction.llm_model or "",
                    "extraction_created_at": (
                        extraction.created_at.isoformat() if extraction.created_at else ""
                    ),
                    "attribute_name": spec.name,
                    "attribute_category": spec.category,
                    "attribute_type": spec.extraction_type,
                    "attribute_out_of_scope": "true" if spec.out_of_scope else "false",
                    "attribute_value": _csv_value((extraction.content or {}).get(spec.name)),
                }
            )
    return buf.getvalue()


def export_project(uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID) -> dict:
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extractions = uow.extractions.list_by_project(project.id)
        comments = uow.comments.list_by_project(project.id)
        latest_extraction = extractions[0] if extractions else None
        coverage = compute_coverage(
            latest_extraction.content if latest_extraction else {},
            extraction_id=str(latest_extraction.id) if latest_extraction else None,
        )

    return _to_jsonable(
        {
            "schema_version": "1.0",
            "exported_at": datetime.now(tz=UTC).isoformat(),
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
            "extractions": [
                {
                    "id": e.id,
                    "source": e.source,
                    "llm_model": e.llm_model,
                    "source_description_hash": e.source_description_hash,
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
        }
    )
