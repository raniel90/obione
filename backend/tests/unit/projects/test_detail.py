import pytest

from obione.auth.models import User
from obione.comments.schemas import CommentCreate
from obione.comments.service import create_comment
from obione.extractions.models import Extraction
from obione.projects.exceptions import ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import (
    add_client_to_project,
    create_project,
    get_project_detail,
)
from obione.shared.ids import new_id
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


def _llm(project_id, **content_extras) -> Extraction:
    content = {"_meta": {"origem": "llm"}}
    content.update(content_extras)
    return Extraction(
        project_id=project_id,
        source="llm",
        llm_model="mock",
        content=content,
        created_by=None,
    )


def _gabarito(project_id, **content_extras) -> Extraction:
    content = {"_meta": {"origem": "gabarito_manual"}}
    content.update(content_extras)
    return Extraction(
        project_id=project_id,
        source="manual",
        llm_model=None,
        content=content,
        created_by=None,
    )


@pytest.mark.unit
def test_detail_empty_project_has_zero_counts():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    d = get_project_detail(uow, consultant, project.id)
    assert d.project.id == project.id
    assert d.latest_llm is None
    assert d.latest_gabarito is None
    assert d.evaluation is None
    assert d.recent_comments == []
    assert d.total_extractions == 0
    assert d.total_comments == 0
    assert d.coverage.filled == 0


@pytest.mark.unit
def test_detail_picks_latest_of_each_extraction_kind():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    uow.extractions.add(_llm(project.id, nome_projeto="LLM"))
    uow.extractions.add(_gabarito(project.id, nome_projeto="Gabarito"))

    d = get_project_detail(uow, consultant, project.id)
    assert d.latest_llm is not None
    assert d.latest_gabarito is not None
    assert d.latest_llm.content["nome_projeto"] == "LLM"
    assert d.latest_gabarito.content["nome_projeto"] == "Gabarito"
    assert d.total_extractions == 2


@pytest.mark.unit
def test_detail_evaluation_present_only_when_both_extractions_exist():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )

    # Only llm — no evaluation
    uow.extractions.add(_llm(project.id, nome_projeto="X"))
    d = get_project_detail(uow, consultant, project.id)
    assert d.evaluation is None

    # Add a gabarito — evaluation appears
    uow.extractions.add(_gabarito(project.id, nome_projeto="X"))
    d = get_project_detail(uow, consultant, project.id)
    assert d.evaluation is not None
    assert d.evaluation.estruturado_metrics.tp >= 1


@pytest.mark.unit
def test_detail_coverage_uses_most_recent_extraction():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    # Most-recent insert wins in the Fake (it preserves insertion order;
    # the SqlAlchemy repo orders by created_at desc — both yield "[0] is latest").
    uow.extractions.add(_llm(project.id, nome_projeto="A"))
    uow.extractions.add(_llm(project.id, nome_projeto="B", porte="pequeno"))
    d = get_project_detail(uow, consultant, project.id)
    assert d.coverage.filled >= 1
    assert d.coverage.total_in_scope == 43


@pytest.mark.unit
def test_detail_recent_comments_newest_first_with_limit():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    created_ids = []
    for i in range(25):
        c = create_comment(uow, consultant, project.id, CommentCreate(body=f"c{i}"))
        created_ids.append(c.id)

    d = get_project_detail(uow, consultant, project.id, comments_limit=5)
    assert len(d.recent_comments) == 5
    # Newest-first: should be c24, c23, c22, c21, c20
    assert [c.id for c in d.recent_comments] == list(reversed(created_ids[-5:]))
    assert d.total_comments == 25


@pytest.mark.unit
def test_detail_zero_comments_limit_returns_empty_but_keeps_total():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    for i in range(3):
        create_comment(uow, consultant, project.id, CommentCreate(body=f"c{i}"))
    d = get_project_detail(uow, consultant, project.id, comments_limit=0)
    assert d.recent_comments == []
    assert d.total_comments == 3


@pytest.mark.unit
def test_detail_visibility_404_for_unassigned_client():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    other_client = _user("client", "other")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    with pytest.raises(ProjectNotFoundError):
        get_project_detail(uow, other_client, project.id)


@pytest.mark.unit
def test_detail_visibility_assigned_client_sees_project():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    add_client_to_project(uow, consultant, project.id, client.id)
    d = get_project_detail(uow, client, project.id)
    assert d.project.id == project.id
