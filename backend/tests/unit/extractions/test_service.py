import pytest

from obione.auth.models import User
from obione.extractions.llm.mock import MockExtractor
from obione.extractions.service import (
    create_extraction_from_manual,
    create_extraction_from_pipeline,
    extract_for_project,
    list_extractions_for_project,
)
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork
from tests._helpers import SAMPLE_DESCRIPTION


def _consultant() -> User:
    return User(id=new_id(), email="c@x.com", password_hash="x", name="C", role="consultant")


@pytest.mark.unit
def test_create_from_pipeline_persists_extraction():
    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    extractor = MockExtractor()
    e = create_extraction_from_pipeline(
        uow,
        extractor,
        consultant,
        project_id=project.id,
        document_id=None,
        text="any text payload",
    )
    assert e.source == "llm"
    assert e.llm_model == "mock"
    assert "_meta" in e.content
    assert e.source_description_hash is not None
    assert len(list_extractions_for_project(uow, consultant, project.id)) == 1


@pytest.mark.unit
def test_extract_for_project_uses_project_description():
    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    extractor = MockExtractor()
    e = extract_for_project(uow, extractor, consultant, project_id=project.id)
    assert e.source == "llm"
    assert e.source_description_hash is not None
    assert len(e.source_description_hash) == 64  # sha256 hex digest


@pytest.mark.unit
def test_extract_for_project_forbids_client():
    from obione.projects.exceptions import ClientCannotMutateError

    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    client = User(id=new_id(), email="cli@x.com", password_hash="x", name="C", role="client")
    uow.projects.add_client(project.id, client.id)
    extractor = MockExtractor()
    with pytest.raises(ClientCannotMutateError):
        extract_for_project(uow, extractor, client, project_id=project.id)


@pytest.mark.unit
def test_create_manual_persists():
    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    e = create_extraction_from_manual(
        uow,
        consultant,
        project_id=project.id,
        document_id=None,
        content={
            "_meta": {
                "projeto_nome": "p",
                "documento_fonte": "d.docx",
                "data_extracao": "2026-05-21T00:00:00Z",
                "origem": "gabarito_manual",
            },
            "nome_projeto": "Manual Override",
        },
    )
    assert e.source == "manual"
    assert e.llm_model is None
    assert e.created_by == consultant.id
