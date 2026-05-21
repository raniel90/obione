"""HTTP route for project export (US18)."""

import uuid

from fastapi import APIRouter

from obione.auth.dependencies import CurrentUser, get_uow
from obione.exports import service

router = APIRouter(prefix="/projects/{project_id}/export", tags=["exports"])


@router.get("", response_model=None)
def export_project(project_id: uuid.UUID, user: CurrentUser) -> dict:
    """JSON bundle: project + documents + extractions + comments + coverage."""
    return service.export_project(get_uow(), user, project_id)
