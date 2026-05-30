"""HTTP routes for the CBAC layer."""

from uuid import UUID

from fastapi import APIRouter, status

from obione.auth.dependencies import CurrentUser, get_uow
from obione.visibility import service
from obione.visibility.schemas import (
    AttributeVisibilityResponse,
    BulkVisibilityRequest,
    CategoryVisibilityResponse,
    SetVisibilityRequest,
    VisibilityStateResponse,
)

router = APIRouter(prefix="/projects/{project_id}/visibility", tags=["visibility"])


@router.get("", response_model=VisibilityStateResponse)
def get_state(project_id: UUID, user: CurrentUser) -> VisibilityStateResponse:
    state = service.get_visibility_state(get_uow(), user, project_id)
    return VisibilityStateResponse(
        categories=[CategoryVisibilityResponse.model_validate(c) for c in state.categories],
        overrides=[AttributeVisibilityResponse.model_validate(o) for o in state.overrides],
        resolved=state.resolved,
    )


@router.put("/categories/{category_key}", status_code=status.HTTP_204_NO_CONTENT)
def set_category(
    project_id: UUID, category_key: str, body: SetVisibilityRequest, user: CurrentUser
) -> None:
    service.set_category(get_uow(), user, project_id, category_key, body.visible)


@router.put("/attributes/{attribute_key}", status_code=status.HTTP_204_NO_CONTENT)
def set_attribute(
    project_id: UUID, attribute_key: str, body: SetVisibilityRequest, user: CurrentUser
) -> None:
    service.set_attribute(get_uow(), user, project_id, attribute_key, body.visible)


@router.delete("/attributes/{attribute_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attribute_override(project_id: UUID, attribute_key: str, user: CurrentUser) -> None:
    service.delete_attribute_override(get_uow(), user, project_id, attribute_key)


@router.put("", status_code=status.HTTP_204_NO_CONTENT)
def set_bulk(project_id: UUID, body: BulkVisibilityRequest, user: CurrentUser) -> None:
    service.set_bulk(
        get_uow(),
        user,
        project_id,
        categories=[(c.category_key, c.visible) for c in body.categories],
        overrides=[(o.attribute_key, o.visible) for o in body.overrides],
    )
