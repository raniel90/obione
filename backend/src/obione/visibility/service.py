"""CBAC use cases.

Resolution rule for each attribute:
    visible = override.value (if exists)
              else category.value (if exists for the attribute's category)
              else False  (default oculto, privacy by default)
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from obione.auth.models import User
from obione.extractions.coverage import all_attributes, all_categories, category_of
from obione.projects.service import get_project_for_user
from obione.shared.exceptions import ForbiddenError
from obione.unit_of_work import AbstractUnitOfWork
from obione.visibility.exceptions import (
    InvalidAttributeKeyError,
    InvalidCategoryKeyError,
)


@dataclass(frozen=True)
class VisibilityState:
    """All knobs + resolved view returned to the consultant."""

    categories: list
    overrides: list
    resolved: dict[str, bool]


def _require_consultant_or_admin(user: User) -> None:
    if user.role not in ("consultant", "admin"):
        raise ForbiddenError("Only consultants/admin can configure visibility.")


def resolve_visibility(uow: AbstractUnitOfWork, project_id: uuid.UUID) -> dict[str, bool]:
    """Compute the per-attribute visibility for a project.

    Returns a dict with 44 entries (one per Quadro-37 attribute). The CBAC
    rule is: override beats category, category fills in the rest, ausência
    de configuração = oculto (privacy by default).
    """
    with uow:
        cats = {r.category_key: r.visible for r in uow.visibility.list_categories(project_id)}
        overs = {r.attribute_key: r.visible for r in uow.visibility.list_attributes(project_id)}
    return {attr: overs.get(attr, cats.get(category_of(attr), False)) for attr in all_attributes()}


def get_visibility_state(uow, user, project_id) -> VisibilityState:
    _require_consultant_or_admin(user)
    get_project_for_user(uow, user, project_id)
    with uow:
        cats = list(uow.visibility.list_categories(project_id))
        overs = list(uow.visibility.list_attributes(project_id))
    resolved = resolve_visibility(uow, project_id)
    return VisibilityState(categories=cats, overrides=overs, resolved=resolved)


def set_category(uow, user, project_id, category_key: str, visible: bool) -> None:
    _require_consultant_or_admin(user)
    get_project_for_user(uow, user, project_id)
    if category_key not in all_categories():
        raise InvalidCategoryKeyError(f"Categoria inválida: {category_key}")
    with uow:
        uow.visibility.upsert_category(project_id, category_key, visible)
        uow.commit()


def set_attribute(uow, user, project_id, attribute_key: str, visible: bool) -> None:
    _require_consultant_or_admin(user)
    get_project_for_user(uow, user, project_id)
    if attribute_key not in all_attributes():
        raise InvalidAttributeKeyError(f"Atributo inválido: {attribute_key}")
    with uow:
        uow.visibility.upsert_attribute(project_id, attribute_key, visible)
        uow.commit()


def delete_attribute_override(uow, user, project_id, attribute_key: str) -> None:
    _require_consultant_or_admin(user)
    get_project_for_user(uow, user, project_id)
    if attribute_key not in all_attributes():
        raise InvalidAttributeKeyError(f"Atributo inválido: {attribute_key}")
    with uow:
        uow.visibility.delete_attribute(project_id, attribute_key)
        uow.commit()


def set_bulk(
    uow,
    user,
    project_id,
    *,
    categories: list[tuple[str, bool]],
    overrides: list[tuple[str, bool]],
) -> None:
    """Replace the full CBAC state of a project in a single transaction.

    Validates every key before any write. Existing rows not present in the
    payload are removed; existing rows in the payload are upserted.
    """
    _require_consultant_or_admin(user)
    get_project_for_user(uow, user, project_id)
    for key, _ in categories:
        if key not in all_categories():
            raise InvalidCategoryKeyError(f"Categoria inválida: {key}")
    for key, _ in overrides:
        if key not in all_attributes():
            raise InvalidAttributeKeyError(f"Atributo inválido: {key}")
    incoming_cats = {k for k, _ in categories}
    incoming_attrs = {k for k, _ in overrides}
    with uow:
        for existing in list(uow.visibility.list_attributes(project_id)):
            if existing.attribute_key not in incoming_attrs:
                uow.visibility.delete_attribute(project_id, existing.attribute_key)
        for existing_cat in list(uow.visibility.list_categories(project_id)):
            if existing_cat.category_key not in incoming_cats:
                # Mark the category as oculto (=False) when absent from payload.
                # Hard delete would also work; upsert(false) keeps an explicit
                # audit row that the consultant chose to hide it.
                uow.visibility.upsert_category(project_id, existing_cat.category_key, False)
        for key, visible in categories:
            uow.visibility.upsert_category(project_id, key, visible)
        for key, visible in overrides:
            uow.visibility.upsert_attribute(project_id, key, visible)
        uow.commit()
