"""HTTP routes for theme suggestions (RF19)."""

from uuid import UUID

from fastapi import APIRouter, Depends

from obione.auth.dependencies import CurrentUser, get_uow
from obione.themes import service
from obione.themes.dependencies import get_theme_classifier
from obione.themes.generator.port import AbstractThemeClassifier
from obione.themes.schemas import ThemeSuggestionResponse

project_router = APIRouter(prefix="/projects/{project_id}/themes", tags=["themes"])
suggestion_router = APIRouter(prefix="/themes", tags=["themes"])


@project_router.post("/suggest", response_model=ThemeSuggestionResponse, status_code=201)
def post_suggest(
    project_id: UUID,
    user: CurrentUser,
    classifier: AbstractThemeClassifier = Depends(get_theme_classifier),
) -> ThemeSuggestionResponse:
    suggestion = service.suggest_theme(get_uow(), classifier, user, project_id=project_id)
    return ThemeSuggestionResponse.model_validate(suggestion)


@project_router.get("/suggestions", response_model=list[ThemeSuggestionResponse])
def list_for_project(project_id: UUID, user: CurrentUser) -> list[ThemeSuggestionResponse]:
    items = service.list_suggestions(get_uow(), user, project_id)
    return [ThemeSuggestionResponse.model_validate(s) for s in items]


@suggestion_router.post(
    "/suggestions/{suggestion_id}/accept", response_model=ThemeSuggestionResponse
)
def post_accept(suggestion_id: UUID, user: CurrentUser) -> ThemeSuggestionResponse:
    accepted = service.accept_suggestion(get_uow(), user, suggestion_id)
    return ThemeSuggestionResponse.model_validate(accepted)
