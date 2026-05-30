import pytest

from obione.auth.models import User
from obione.drafts.exceptions import (
    DraftAlreadyPublishedError,
    DraftNotFoundError,
    NoExtractionForDraftError,
)
from obione.drafts.generator.mock import MockDraftGenerator
from obione.drafts.schemas import DraftUpdate
from obione.drafts.service import (
    delete_draft,
    generate_drafts,
    get_draft_for_user,
    list_drafts_for_user,
    publish_draft,
    update_draft,
)
from obione.extractions.models import Extraction
from obione.projects.exceptions import ClientCannotMutateError, ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
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


def _extraction_for(project_id, **content_extras) -> Extraction:
    content = {"_meta": {"origem": "llm"}, "nome_projeto": "X"}
    content.update(content_extras)
    return Extraction(
        project_id=project_id,
        document_id=None,
        source="llm",
        llm_model="mock",
        content=content,
        created_by=None,
    )


def _project_with_extraction(uow, consultant, **extras):
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    uow.extractions.add(_extraction_for(project.id, **extras))
    return project


@pytest.mark.unit
def test_generate_creates_multiple_drafts():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = _project_with_extraction(
        uow,
        consultant,
        escopo_planejado="x",  # next_step
        status_cronograma="atrasado",  # attention_point
        riscos_identificados="x",  # attention_point
    )
    drafts = generate_drafts(uow, MockDraftGenerator(), consultant, project.id)
    assert len(drafts) >= 3
    assert all(d.status == "draft" for d in drafts)
    assert all(d.llm_model == "mock-drafts-v1" for d in drafts)
    kinds = {d.kind for d in drafts}
    assert kinds <= {"next_step", "attention_point"}


@pytest.mark.unit
def test_generate_rejects_client_role():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant)
    add_client_to_project(uow, consultant, project.id, client.id)
    with pytest.raises(ClientCannotMutateError):
        generate_drafts(uow, MockDraftGenerator(), client, project.id)


@pytest.mark.unit
def test_generate_rejects_when_no_extraction():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    with pytest.raises(NoExtractionForDraftError):
        generate_drafts(uow, MockDraftGenerator(), consultant, project.id)


@pytest.mark.unit
def test_consultant_sees_all_client_only_published():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(
        uow, consultant, escopo_planejado="x", status_cronograma="atrasado"
    )
    add_client_to_project(uow, consultant, project.id, client.id)

    drafts = generate_drafts(uow, MockDraftGenerator(), consultant, project.id)
    publish_draft(uow, consultant, drafts[0].id)

    seen_cons = list_drafts_for_user(uow, consultant, project.id)
    seen_cli = list_drafts_for_user(uow, client, project.id)

    assert len(seen_cons) == len(drafts)
    assert {d.id for d in seen_cli} == {drafts[0].id}


@pytest.mark.unit
def test_client_cannot_get_draft():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant, escopo_planejado="x")
    add_client_to_project(uow, consultant, project.id, client.id)
    drafts = generate_drafts(uow, MockDraftGenerator(), consultant, project.id)
    with pytest.raises(DraftNotFoundError):
        get_draft_for_user(uow, client, drafts[0].id)


@pytest.mark.unit
def test_update_only_drafts_only_consultor():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = _project_with_extraction(uow, consultant, escopo_planejado="x")
    drafts = generate_drafts(uow, MockDraftGenerator(), consultant, project.id)
    d = drafts[0]

    edited = update_draft(
        uow, consultant, d.id, DraftUpdate(title="Novo título", body="Novo corpo")
    )
    assert edited.title == "Novo título"
    assert edited.body == "Novo corpo"

    publish_draft(uow, consultant, d.id)
    with pytest.raises(DraftAlreadyPublishedError):
        update_draft(uow, consultant, d.id, DraftUpdate(body="hack"))


@pytest.mark.unit
def test_delete_draft_removes_it_but_blocks_after_publish():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = _project_with_extraction(uow, consultant, escopo_planejado="x")
    drafts = generate_drafts(uow, MockDraftGenerator(), consultant, project.id)
    d = drafts[0]

    delete_draft(uow, consultant, d.id)
    with pytest.raises(DraftNotFoundError):
        get_draft_for_user(uow, consultant, d.id)

    # Try to delete a published one
    other = drafts[1]
    publish_draft(uow, consultant, other.id)
    with pytest.raises(DraftAlreadyPublishedError):
        delete_draft(uow, consultant, other.id)


@pytest.mark.unit
def test_publish_stamps_and_blocks_double_publish():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = _project_with_extraction(uow, consultant, escopo_planejado="x")
    drafts = generate_drafts(uow, MockDraftGenerator(), consultant, project.id)
    d = drafts[0]

    published = publish_draft(uow, consultant, d.id)
    assert published.status == "published"
    assert published.reviewed_by == consultant.id
    assert published.reviewed_at is not None

    with pytest.raises(DraftAlreadyPublishedError):
        publish_draft(uow, consultant, d.id)


@pytest.mark.unit
def test_client_cannot_mutate_anything():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    project = _project_with_extraction(uow, consultant, escopo_planejado="x")
    add_client_to_project(uow, consultant, project.id, client.id)
    drafts = generate_drafts(uow, MockDraftGenerator(), consultant, project.id)
    d = drafts[0]

    for op in (
        lambda: update_draft(uow, client, d.id, DraftUpdate(body="x")),
        lambda: delete_draft(uow, client, d.id),
        lambda: publish_draft(uow, client, d.id),
    ):
        with pytest.raises(ClientCannotMutateError):
            op()


@pytest.mark.unit
def test_unassigned_client_cannot_see_drafts():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    other_client = _user("client", "other")
    project = _project_with_extraction(uow, consultant, escopo_planejado="x")
    with pytest.raises(ProjectNotFoundError):
        list_drafts_for_user(uow, other_client, project.id)
