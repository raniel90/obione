import pytest

from obione.auth.models import User
from obione.likert.exceptions import WrongLikertRoleError
from obione.likert.schemas import (
    CLIENT_DIMENSIONS,
    CONSULTORIA_DIMENSIONS,
    ClientLikertCreate,
    ConsultoriaLikertCreate,
)
from obione.likert.service import (
    list_responses,
    submit_client_feedback,
    submit_consultoria_feedback,
    summarize_responses,
)
from obione.projects.exceptions import ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


def _user(role: str = "consultant", suffix: str = "x") -> User:
    return User(
        id=new_id(),
        email=f"{role}-{suffix}@x.com",
        password_hash="x",
        name="N",
        role=role,
    )


_GOOD_CONS = {
    "utilidade_drafts": 4,
    "reducao_friccao": 5,
    "qualidade_resumo": 3,
    "manutenibilidade_mediador": 4,
}


@pytest.mark.unit
def test_consultoria_submission_creates_four_rows():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    rows = submit_consultoria_feedback(uow, consultant, ConsultoriaLikertCreate(**_GOOD_CONS))
    assert len(rows) == 4
    assert {r.dimension for r in rows} == set(CONSULTORIA_DIMENSIONS)
    assert all(r.kind == "consultoria" for r in rows)
    assert all(r.project_id is None for r in rows)
    assert all(r.respondent_id == consultant.id for r in rows)


@pytest.mark.unit
def test_consultoria_rejects_client_role():
    uow = FakeUnitOfWork()
    client = _user("client")
    with pytest.raises(WrongLikertRoleError):
        submit_consultoria_feedback(uow, client, ConsultoriaLikertCreate(**_GOOD_CONS))


@pytest.mark.unit
def test_consultoria_accepts_admin():
    uow = FakeUnitOfWork()
    admin = _user("admin")
    rows = submit_consultoria_feedback(uow, admin, ConsultoriaLikertCreate(**_GOOD_CONS))
    assert len(rows) == 4


_GOOD_CLIENT = {
    "clareza_resumo": 5,
    "utilidade_espaco": 4,
    "qualidade_dialogo": 4,
    "sentido_inclusao": 5,
}


@pytest.mark.unit
def test_client_submission_creates_four_rows_with_project_id():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    add_client_to_project(uow, consultant, project.id, client.id)

    rows = submit_client_feedback(
        uow, client, ClientLikertCreate(project_id=project.id, **_GOOD_CLIENT)
    )
    assert len(rows) == 4
    assert {r.dimension for r in rows} == set(CLIENT_DIMENSIONS)
    assert all(r.kind == "client" for r in rows)
    assert all(r.project_id == project.id for r in rows)


@pytest.mark.unit
def test_client_rejects_unassigned_project():
    """The visibility check piggy-backs on get_project_for_user."""
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    other_client = _user("client", "other")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    # other_client is NOT in project_clients.
    with pytest.raises(ProjectNotFoundError):
        submit_client_feedback(
            uow, other_client, ClientLikertCreate(project_id=project.id, **_GOOD_CLIENT)
        )


@pytest.mark.unit
def test_client_rejects_consultant_role():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    with pytest.raises(WrongLikertRoleError):
        submit_client_feedback(
            uow, consultant, ClientLikertCreate(project_id=project.id, **_GOOD_CLIENT)
        )


@pytest.mark.unit
def test_list_responses_restricted_to_consultor_admin():
    uow = FakeUnitOfWork()
    client = _user("client")
    with pytest.raises(WrongLikertRoleError):
        list_responses(uow, client, kind="consultoria")


@pytest.mark.unit
def test_summary_aggregates_per_dimension():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    cons_c = _user("consultant", "c")
    submit_consultoria_feedback(
        uow,
        cons_a,
        ConsultoriaLikertCreate(**{**_GOOD_CONS, "utilidade_drafts": 5}),
    )
    submit_consultoria_feedback(
        uow,
        cons_b,
        ConsultoriaLikertCreate(**{**_GOOD_CONS, "utilidade_drafts": 3}),
    )
    submit_consultoria_feedback(
        uow,
        cons_c,
        ConsultoriaLikertCreate(**{**_GOOD_CONS, "utilidade_drafts": 4}),
    )

    summary = summarize_responses(uow, cons_a, kind="consultoria")
    assert summary.kind == "consultoria"
    assert summary.respondent_count == 3
    by_dim = {d.dimension: d for d in summary.by_dimension}
    assert by_dim["utilidade_drafts"].count == 3
    assert by_dim["utilidade_drafts"].mean == 4.0
    assert by_dim["utilidade_drafts"].min == 3
    assert by_dim["utilidade_drafts"].max == 5


@pytest.mark.unit
def test_summary_empty_kind_returns_zero_stats():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    summary = summarize_responses(uow, consultant, kind="consultoria")
    assert summary.respondent_count == 0
    for d in summary.by_dimension:
        assert d.count == 0
        assert d.mean == 0.0


@pytest.mark.unit
def test_score_validation_rejects_out_of_range():
    with pytest.raises(Exception):
        ConsultoriaLikertCreate(**{**_GOOD_CONS, "utilidade_drafts": 6})
    with pytest.raises(Exception):
        ConsultoriaLikertCreate(**{**_GOOD_CONS, "reducao_friccao": 0})
