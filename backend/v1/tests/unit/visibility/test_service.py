"""Tests for the CBAC service layer: setters, validation, authorization."""

import pytest

from obione.auth.models import User
from obione.extractions.coverage import all_attributes, all_categories
from obione.projects.exceptions import ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.exceptions import ForbiddenError
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork
from obione.visibility.exceptions import (
    InvalidAttributeKeyError,
    InvalidCategoryKeyError,
)
from obione.visibility.service import (
    delete_attribute_override,
    get_visibility_state,
    set_attribute,
    set_bulk,
    set_category,
)
from tests._helpers import SAMPLE_DESCRIPTION


def _user(role: str = "consultant") -> User:
    return User(id=new_id(), email=f"{role}@x.com", password_hash="x", name="N", role=role)


def _seed_project(uow: FakeUnitOfWork, consultant: User):
    return create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )


@pytest.mark.unit
def test_get_state_returns_resolved_map_for_brand_new_project():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = _seed_project(uow, cons)
    state = get_visibility_state(uow, cons, p.id)
    assert state.categories == []
    assert state.overrides == []
    assert len(state.resolved) == 44
    assert all(v is False for v in state.resolved.values())


@pytest.mark.unit
def test_set_category_persists_and_validates_key():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = _seed_project(uow, cons)
    set_category(uow, cons, p.id, all_categories()[0], True)
    state = get_visibility_state(uow, cons, p.id)
    assert len(state.categories) == 1
    with pytest.raises(InvalidCategoryKeyError):
        set_category(uow, cons, p.id, "not_a_category", True)


@pytest.mark.unit
def test_set_attribute_persists_and_validates_key():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = _seed_project(uow, cons)
    set_attribute(uow, cons, p.id, all_attributes()[0], True)
    state = get_visibility_state(uow, cons, p.id)
    assert len(state.overrides) == 1
    with pytest.raises(InvalidAttributeKeyError):
        set_attribute(uow, cons, p.id, "not_an_attribute", True)


@pytest.mark.unit
def test_delete_override_brings_attribute_back_to_category_default():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = _seed_project(uow, cons)
    cat = all_categories()[0]
    set_category(uow, cons, p.id, cat, True)
    target = next(
        a
        for a in all_attributes()
        if __import__("obione.extractions.coverage", fromlist=["category_of"]).category_of(a) == cat
    )
    set_attribute(uow, cons, p.id, target, False)  # override hides it
    state = get_visibility_state(uow, cons, p.id)
    assert state.resolved[target] is False
    delete_attribute_override(uow, cons, p.id, target)  # back to category=True
    state = get_visibility_state(uow, cons, p.id)
    assert state.resolved[target] is True


@pytest.mark.unit
def test_client_cannot_configure_visibility():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    cli = _user("client")
    p = _seed_project(uow, cons)
    with pytest.raises(ForbiddenError):
        set_category(uow, cli, p.id, all_categories()[0], True)
    with pytest.raises(ForbiddenError):
        set_attribute(uow, cli, p.id, all_attributes()[0], True)
    with pytest.raises(ForbiddenError):
        get_visibility_state(uow, cli, p.id)


@pytest.mark.unit
def test_set_category_on_invisible_project_is_404():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant")
    cons_b = User(id=new_id(), email="b@x.com", password_hash="x", name="B", role="consultant")
    p = _seed_project(uow, cons_a)
    with pytest.raises(ProjectNotFoundError):
        set_category(uow, cons_b, p.id, all_categories()[0], True)


@pytest.mark.unit
def test_set_bulk_replaces_state():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = _seed_project(uow, cons)
    set_category(uow, cons, p.id, all_categories()[0], True)
    set_attribute(uow, cons, p.id, all_attributes()[5], True)
    # Now replace with a different state.
    set_bulk(
        uow,
        cons,
        p.id,
        categories=[(all_categories()[1], True)],
        overrides=[(all_attributes()[10], True)],
    )
    state = get_visibility_state(uow, cons, p.id)
    cat_keys = {c.category_key for c in state.categories if c.visible}
    over_keys = {o.attribute_key for o in state.overrides if o.visible}
    assert cat_keys == {all_categories()[1]}
    assert over_keys == {all_attributes()[10]}
