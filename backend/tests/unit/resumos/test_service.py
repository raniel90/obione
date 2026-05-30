import pytest

from obione.auth.models import User
from obione.extractions.models import Extraction
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
from obione.resumos.exceptions import (
    NoExtractionForResumoError,
    ResumoAlreadyPublishedError,
    ResumoNotFoundError,
)
from obione.resumos.generator.mock import MockResumoGenerator
from obione.resumos.schemas import ResumoUpdate
from obione.resumos.service import (
    generate_resumo,
    get_resumo_for_user,
    list_resumos_for_user,
    publish_resumo,
    update_resumo,
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


def _extraction(project_id, **content_extras) -> Extraction:
    content = {"_meta": {"origem": "llm"}, "nome_projeto": "X"}
    content.update(content_extras)
    return Extraction(
        project_id=project_id,
        source="llm",
        llm_model="mock",
        content=content,
        created_by=None,
    )


def _project_with_extraction(uow, consultant):
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    uow.extractions.add(_extraction(project.id))
    return project


@pytest.mark.unit
def test_generate_creates_draft_resumo():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = _project_with_extraction(uow, consultant)

    r = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)
    assert r.project_id == project.id
    assert r.status == "draft"
    assert r.body
    assert r.llm_model == "mock-resumo-v1"
    assert r.reviewed_by is None
    assert r.reviewed_at is None


@pytest.mark.unit
def test_generate_rejects_client_role():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant)
    add_client_to_project(uow, consultant, project.id, client.id)

    with pytest.raises(ClientCannotMutateError):
        generate_resumo(uow, MockResumoGenerator(), client, project.id)


@pytest.mark.unit
def test_generate_rejects_when_no_extraction():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    with pytest.raises(NoExtractionForResumoError):
        generate_resumo(uow, MockResumoGenerator(), consultant, project.id)


@pytest.mark.unit
def test_consultant_sees_all_statuses_client_only_published():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant)
    add_client_to_project(uow, consultant, project.id, client.id)

    draft = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)
    published = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)
    publish_resumo(uow, consultant, published.id)

    assert {r.id for r in list_resumos_for_user(uow, consultant, project.id)} == {
        draft.id,
        published.id,
    }
    assert [r.id for r in list_resumos_for_user(uow, client, project.id)] == [published.id]


@pytest.mark.unit
def test_client_cannot_see_draft_via_get():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant)
    add_client_to_project(uow, consultant, project.id, client.id)

    draft = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)
    with pytest.raises(ResumoNotFoundError):
        get_resumo_for_user(uow, client, draft.id)


@pytest.mark.unit
def test_update_only_drafts_only_consultor():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = _project_with_extraction(uow, consultant)
    resumo = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)

    edited = update_resumo(uow, consultant, resumo.id, ResumoUpdate(body="edited body"))
    assert edited.body == "edited body"

    publish_resumo(uow, consultant, resumo.id)
    with pytest.raises(ResumoAlreadyPublishedError):
        update_resumo(uow, consultant, resumo.id, ResumoUpdate(body="hack"))


@pytest.mark.unit
def test_client_cannot_update():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant)
    add_client_to_project(uow, consultant, project.id, client.id)
    resumo = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)

    with pytest.raises(ClientCannotMutateError):
        update_resumo(uow, client, resumo.id, ResumoUpdate(body="hack"))


@pytest.mark.unit
def test_publish_stamps_reviewer_and_makes_immutable():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = _project_with_extraction(uow, consultant)
    resumo = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)

    published = publish_resumo(uow, consultant, resumo.id)
    assert published.status == "published"
    assert published.reviewed_by == consultant.id
    assert published.reviewed_at is not None

    # Double-publish is rejected.
    with pytest.raises(ResumoAlreadyPublishedError):
        publish_resumo(uow, consultant, resumo.id)


@pytest.mark.unit
def test_client_cannot_publish():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant)
    add_client_to_project(uow, consultant, project.id, client.id)
    resumo = generate_resumo(uow, MockResumoGenerator(), consultant, project.id)

    with pytest.raises(ClientCannotMutateError):
        publish_resumo(uow, client, resumo.id)


@pytest.mark.unit
def test_unassigned_client_cannot_see_resumos():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    other_client = _user("client", "other")
    project = _project_with_extraction(uow, consultant)
    # No add_client_to_project — other_client has no access.
    from obione.projects.exceptions import ProjectNotFoundError

    with pytest.raises(ProjectNotFoundError):
        list_resumos_for_user(uow, other_client, project.id)
