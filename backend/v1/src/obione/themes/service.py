"""Theme suggestion use cases (RF19).

`suggest_theme` produces a new row in `theme_suggestions`; the consultant
either `accept_suggestion` (updating `project.domain` and stamping the row)
or simply ignores it. Both paths leave a trail used by the academic
protocol to compute categorization accuracy.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from obione.auth.models import User
from obione.projects.exceptions import ClientCannotMutateError, ProjectNotFoundError
from obione.projects.service import _require_mutator, get_project_for_user
from obione.shared.exceptions import ForbiddenError
from obione.shared.ids import new_id
from obione.themes.exceptions import SuggestionNotFoundError
from obione.themes.generator.port import AbstractThemeClassifier
from obione.themes.models import ThemeSuggestion
from obione.unit_of_work import AbstractUnitOfWork


def suggest_theme(
    uow: AbstractUnitOfWork,
    classifier: AbstractThemeClassifier,
    user: User,
    *,
    project_id: uuid.UUID,
) -> ThemeSuggestion:
    """Run the IA classifier over `project.description` (+ latest extraction
    if available) and log the suggestion. The consultant decides later
    whether to accept it."""
    _require_mutator(user)
    project = get_project_for_user(uow, user, project_id)
    extraction_content: dict | None = None
    with uow:
        extractions = uow.extractions.list_by_project(project.id)
        if extractions:
            extraction_content = extractions[0].content
    result = classifier.classify(project.description, extraction_content)
    with uow:
        suggestion = ThemeSuggestion(
            id=new_id(),
            project_id=project.id,
            suggested_domain=result.domain,
            confidence=result.confidence,
            model_id=result.model_id,
            reasoning=result.reasoning,
            accepted=False,
            created_at=datetime.now(tz=UTC),
        )
        uow.themes.add(suggestion)
        uow.commit()
        return suggestion


def accept_suggestion(
    uow: AbstractUnitOfWork, user: User, suggestion_id: uuid.UUID
) -> ThemeSuggestion:
    """Stamp the suggestion as accepted and propagate its domain to the
    project. Idempotent: re-accepting the same suggestion is a no-op."""
    _require_mutator(user)
    with uow:
        suggestion = uow.themes.get(suggestion_id)
        if suggestion is None:
            raise SuggestionNotFoundError(f"Suggestion not found: {suggestion_id}")
        # Visibility check via the project — also gives 404 to other consultants.
        project = uow.projects.get(suggestion.project_id)
        if project is None:
            raise ProjectNotFoundError(f"Project of suggestion not found: {suggestion_id}")
        from obione.projects.access_control import can_user_see

        if not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project.id}")
        if not suggestion.accepted:
            project.domain = suggestion.suggested_domain
            suggestion.accepted = True
            suggestion.accepted_by = user.id
            suggestion.accepted_at = datetime.now(tz=UTC)
            uow.commit()
        return suggestion


def list_suggestions(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[ThemeSuggestion]:
    """List the suggestion trail for a project. Consultants/admin only."""
    if user.role == "client":
        raise ForbiddenError("Clients cannot read theme suggestions.")
    get_project_for_user(uow, user, project_id)
    with uow:
        return uow.themes.list_by_project(project_id)


__all__ = [
    "ClientCannotMutateError",  # re-export for tests
    "accept_suggestion",
    "list_suggestions",
    "suggest_theme",
]
