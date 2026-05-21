"""HTTP route for project export (US18)."""

import uuid
from typing import Literal

from fastapi import APIRouter, Query, Response

from obione.auth.dependencies import CurrentUser, get_uow
from obione.exports import service

router = APIRouter(prefix="/projects/{project_id}/export", tags=["exports"])


@router.get("", response_model=None)
def export_project(
    project_id: uuid.UUID,
    user: CurrentUser,
    format: Literal["json", "csv"] = Query(
        default="json",
        description=(
            "json (default): full bundle of project + docs + extractions + "
            "comments + coverage. csv: long-format spreadsheet with one row "
            "per (extraction × attribute) — fits the Sprint 5 evaluation "
            "rubric workflow."
        ),
    ),
) -> Response | dict:
    if format == "csv":
        body = service.export_project_attributes_csv(get_uow(), user, project_id)
        return Response(
            content=body,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": (f'attachment; filename="obione-export-{project_id}.csv"'),
            },
        )
    return service.export_project(get_uow(), user, project_id)
