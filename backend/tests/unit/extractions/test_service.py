import pytest

from obione.auth.models import User
from obione.extractions.llm.mock import MockExtractor
from obione.extractions.service import (
    create_extraction_from_manual,
    create_extraction_from_pipeline,
    list_extractions_for_project,
)
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


def _consultant() -> User:
    return User(id=new_id(), email="c@x.com", password_hash="x", name="C", role="consultant")


@pytest.mark.unit
def test_create_from_pipeline_persists_extraction():
    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    extractor = MockExtractor()
    e = create_extraction_from_pipeline(
        uow, extractor, consultant,
        project_id=project.id, document_id=None, document_bytes=b"x",
    )
    assert e.source == "llm"
    assert e.llm_model == "mock"
    assert "_meta" in e.content
    assert len(list_extractions_for_project(uow, consultant, project.id)) == 1


@pytest.mark.unit
def test_create_manual_persists():
    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    e = create_extraction_from_manual(
        uow, consultant,
        project_id=project.id, document_id=None,
        content={"project_name": "Manual Override"},
    )
    assert e.source == "manual"
    assert e.llm_model is None
    assert e.created_by == consultant.id
