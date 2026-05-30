"""Service-level tests for theme suggestions."""

import pytest

from obione.auth.models import User
from obione.projects.exceptions import ClientCannotMutateError, ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
from obione.shared.exceptions import ForbiddenError
from obione.shared.ids import new_id
from obione.themes.exceptions import SuggestionNotFoundError
from obione.themes.generator.mock import MockThemeClassifier
from obione.themes.service import accept_suggestion, list_suggestions, suggest_theme
from obione.unit_of_work import FakeUnitOfWork
from tests._helpers import SAMPLE_DESCRIPTION


def _user(role: str = "consultant", suffix: str = "x") -> User:
    return User(
        id=new_id(),
        email=f"{role}-{suffix}@x.com",
        password_hash="x",
        name="N",
        role=role,
    )


@pytest.mark.unit
def test_suggest_persists_record_for_consultant():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = create_project(
        uow, cons, ProjectCreate(name="P", domain="other", description=SAMPLE_DESCRIPTION)
    )
    s = suggest_theme(uow, MockThemeClassifier(), cons, project_id=p.id)
    assert s.project_id == p.id
    assert s.model_id == "mock"
    assert s.accepted is False
    assert s.accepted_by is None
    assert s.accepted_at is None


@pytest.mark.unit
def test_suggest_forbidden_for_client():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    cli = _user("client")
    p = create_project(
        uow, cons, ProjectCreate(name="P", domain="other", description=SAMPLE_DESCRIPTION)
    )
    add_client_to_project(uow, cons, p.id, cli.id)
    with pytest.raises(ClientCannotMutateError):
        suggest_theme(uow, MockThemeClassifier(), cli, project_id=p.id)


@pytest.mark.unit
def test_accept_updates_project_domain_and_stamps_row():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = create_project(
        uow, cons, ProjectCreate(name="P", domain="other", description=SAMPLE_DESCRIPTION)
    )
    s = suggest_theme(uow, MockThemeClassifier(), cons, project_id=p.id)
    accepted = accept_suggestion(uow, cons, s.id)
    assert accepted.accepted is True
    assert accepted.accepted_by == cons.id
    assert accepted.accepted_at is not None
    refreshed_project = uow.projects.get(p.id)
    assert refreshed_project.domain == accepted.suggested_domain


@pytest.mark.unit
def test_accept_is_idempotent():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = create_project(
        uow, cons, ProjectCreate(name="P", domain="other", description=SAMPLE_DESCRIPTION)
    )
    s = suggest_theme(uow, MockThemeClassifier(), cons, project_id=p.id)
    accept_suggestion(uow, cons, s.id)
    again = accept_suggestion(uow, cons, s.id)
    assert again.accepted is True


@pytest.mark.unit
def test_accept_404_for_missing_suggestion():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    with pytest.raises(SuggestionNotFoundError):
        accept_suggestion(uow, cons, new_id())


@pytest.mark.unit
def test_accept_404_for_other_consultants_project():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    p = create_project(
        uow, cons_a, ProjectCreate(name="P", domain="other", description=SAMPLE_DESCRIPTION)
    )
    s = suggest_theme(uow, MockThemeClassifier(), cons_a, project_id=p.id)
    with pytest.raises(ProjectNotFoundError):
        accept_suggestion(uow, cons_b, s.id)


@pytest.mark.unit
def test_list_suggestions_forbidden_for_client():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    cli = _user("client")
    p = create_project(
        uow, cons, ProjectCreate(name="P", domain="other", description=SAMPLE_DESCRIPTION)
    )
    add_client_to_project(uow, cons, p.id, cli.id)
    with pytest.raises(ForbiddenError):
        list_suggestions(uow, cli, p.id)


@pytest.mark.unit
def test_list_returns_in_creation_order_desc():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    p = create_project(
        uow, cons, ProjectCreate(name="P", domain="other", description=SAMPLE_DESCRIPTION)
    )
    s1 = suggest_theme(uow, MockThemeClassifier(), cons, project_id=p.id)
    # second suggestion must be stamped strictly after the first one. The
    # Fake repo orders by created_at desc when both are set.
    from datetime import UTC, datetime, timedelta

    if s1.created_at is None:
        s1.created_at = datetime.now(tz=UTC)
    s2 = suggest_theme(uow, MockThemeClassifier(), cons, project_id=p.id)
    s2.created_at = (s1.created_at or datetime.now(tz=UTC)) + timedelta(seconds=1)
    items = list_suggestions(uow, cons, p.id)
    assert [i.id for i in items[:2]] == [s2.id, s1.id]
