import pytest

from obione.auth.models import User
from obione.extractions.models import Extraction
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
from obione.shared.ids import new_id
from obione.synthesis.exceptions import (
    SynthesisAlreadyPublishedError,
    SynthesisNoProjectsError,
)
from obione.synthesis.generator.mock import MockSynthesisGenerator
from obione.synthesis.schemas import SynthesisUpdate
from obione.synthesis.service import (
    delete_synthesis,
    generate_synthesis,
    list_published_for_project,
    list_syntheses_by_domain,
    publish_synthesis,
    update_synthesis,
)
from obione.unit_of_work import FakeUnitOfWork
from tests._helpers import SAMPLE_DESCRIPTION


def _user(role: str = "consultant", suffix: str = "x") -> User:
    return User(id=new_id(), email=f"{role}-{suffix}@x.com", password_hash="x", name="N", role=role)


def _legal_project(uow, consultant, name: str, **lessons):
    project = create_project(
        uow, consultant, ProjectCreate(name=name, domain="legal", description=SAMPLE_DESCRIPTION)
    )
    content = {"_meta": {"origem": "llm"}, "nome_projeto": name}
    content.update(lessons)
    uow.extractions.add(
        Extraction(project_id=project.id, source="llm", llm_model="mock", content=content)
    )
    return project


@pytest.mark.unit
def test_generate_creates_draft_from_theme_projects():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    _legal_project(uow, cons, "Alfa ADV", pontos_fortes="boa comunicação")
    _legal_project(uow, cons, "Beta ADV", riscos_identificados="prazo apertado")

    synthesis = generate_synthesis(uow, MockSynthesisGenerator(), cons, "legal")

    assert synthesis.status == "draft"
    assert synthesis.domain == "legal"
    assert synthesis.llm_model == "mock-synthesis-v1"
    assert len(synthesis.source_project_ids) == 2
    assert synthesis.generated_by == cons.id


@pytest.mark.unit
def test_generated_body_is_anonymized_no_project_names():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    _legal_project(
        uow, cons, "Escritorio Secreto XPTO", pontos_fortes="forte", riscos_identificados="risco"
    )

    synthesis = generate_synthesis(uow, MockSynthesisGenerator(), cons, "legal")

    # The synthesis must NOT leak the project/client name (LGPD mitigation).
    assert "Escritorio Secreto XPTO" not in synthesis.body
    assert "XPTO" not in synthesis.body


@pytest.mark.unit
def test_generate_rejects_client():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    cli = _user("client")
    p = _legal_project(uow, cons, "Alfa ADV", pontos_fortes="x")
    add_client_to_project(uow, cons, p.id, cli.id)
    with pytest.raises(ClientCannotMutateError):
        generate_synthesis(uow, MockSynthesisGenerator(), cli, "legal")


@pytest.mark.unit
def test_generate_without_projects_raises():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    with pytest.raises(SynthesisNoProjectsError):
        generate_synthesis(uow, MockSynthesisGenerator(), cons, "legal")


@pytest.mark.unit
def test_publish_stamps_and_blocks_mutations():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    _legal_project(uow, cons, "Alfa ADV", pontos_fortes="x")
    synthesis = generate_synthesis(uow, MockSynthesisGenerator(), cons, "legal")

    published = publish_synthesis(uow, cons, synthesis.id)
    assert published.status == "published"
    assert published.reviewed_by == cons.id
    assert published.reviewed_at is not None

    with pytest.raises(SynthesisAlreadyPublishedError):
        publish_synthesis(uow, cons, synthesis.id)
    with pytest.raises(SynthesisAlreadyPublishedError):
        update_synthesis(uow, cons, synthesis.id, SynthesisUpdate(body="tarde demais"))
    with pytest.raises(SynthesisAlreadyPublishedError):
        delete_synthesis(uow, cons, synthesis.id)


@pytest.mark.unit
def test_client_reads_only_published_of_its_project_theme():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    cli = _user("client")
    project = _legal_project(uow, cons, "Alfa ADV", pontos_fortes="x")
    add_client_to_project(uow, cons, project.id, cli.id)
    synthesis = generate_synthesis(uow, MockSynthesisGenerator(), cons, "legal")

    # Still a draft → client sees nothing.
    assert list_published_for_project(uow, cli, project.id) == []

    publish_synthesis(uow, cons, synthesis.id)
    seen = list_published_for_project(uow, cli, project.id)
    assert [s.id for s in seen] == [synthesis.id]

    # Staff history endpoint is blocked for clients.
    with pytest.raises(ClientCannotMutateError):
        list_syntheses_by_domain(uow, cli, "legal")
