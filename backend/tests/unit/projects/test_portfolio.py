import pytest

from obione.auth.models import User
from obione.documents.models import Document
from obione.extractions.models import Extraction
from obione.projects.schemas import ProjectCreate
from obione.projects.service import (
    add_client_to_project,
    create_project,
    list_portfolio_for_user,
)
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


def _docx(project_id, sha: str = "a" * 64) -> Document:
    return Document(
        project_id=project_id,
        original_name="d.docx",
        relative_path="x.docx",
        sha256=sha,
        size_bytes=10,
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploaded_by=None,
    )


@pytest.mark.unit
def test_status_registered_when_no_documents():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    entries = list_portfolio_for_user(uow, consultant)
    assert len(entries) == 1
    e = entries[0]
    assert e.project.id == project.id
    assert e.status == "registered"
    assert e.document_count == 0
    assert e.extraction_count == 0
    assert e.coverage_percentage == 0.0
    assert e.has_gabarito is False


@pytest.mark.unit
def test_status_ingested_after_document_upload():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.documents.add(_docx(project.id))
    entries = list_portfolio_for_user(uow, consultant)
    assert entries[0].status == "ingested"
    assert entries[0].document_count == 1


@pytest.mark.unit
def test_status_extracted_after_llm_extraction():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.documents.add(_docx(project.id))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={"_meta": {"origem": "llm"}, "nome_projeto": "X"},
            created_by=None,
        )
    )
    entries = list_portfolio_for_user(uow, consultant)
    e = entries[0]
    assert e.status == "extracted"
    assert e.coverage_percentage > 0.0
    assert e.has_gabarito is False


@pytest.mark.unit
def test_status_reviewed_when_gabarito_present():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="manual",
            llm_model=None,
            content={"_meta": {"origem": "gabarito_manual"}, "nome_projeto": "X"},
            created_by=consultant.id,
        )
    )
    entries = list_portfolio_for_user(uow, consultant)
    assert entries[0].status == "reviewed"
    assert entries[0].has_gabarito is True


@pytest.mark.unit
def test_reviewed_overrides_extracted_when_both_present():
    """Even if an llm extraction exists too, gabarito_manual wins the status."""
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={"_meta": {"origem": "llm"}},
            created_by=None,
        )
    )
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="manual",
            llm_model=None,
            content={"_meta": {"origem": "gabarito_manual"}},
            created_by=consultant.id,
        )
    )
    entries = list_portfolio_for_user(uow, consultant)
    assert entries[0].status == "reviewed"
    assert entries[0].extraction_count == 2


@pytest.mark.unit
def test_consultant_sees_only_own_projects():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    p_a = create_project(uow, cons_a, ProjectCreate(name="A", domain="legal"))
    create_project(uow, cons_b, ProjectCreate(name="B", domain="health"))
    entries = list_portfolio_for_user(uow, cons_a)
    assert [e.project.id for e in entries] == [p_a.id]


@pytest.mark.unit
def test_admin_sees_all_projects():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    admin = _user("admin")
    create_project(uow, cons_a, ProjectCreate(name="A", domain="legal"))
    create_project(uow, cons_b, ProjectCreate(name="B", domain="health"))
    entries = list_portfolio_for_user(uow, admin)
    assert len(entries) == 2


@pytest.mark.unit
def test_domain_filter():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    create_project(uow, consultant, ProjectCreate(name="L", domain="legal"))
    create_project(uow, consultant, ProjectCreate(name="H", domain="health"))
    create_project(uow, consultant, ProjectCreate(name="L2", domain="legal"))

    legal = list_portfolio_for_user(uow, consultant, domain="legal")
    assert {e.project.name for e in legal} == {"L", "L2"}

    health = list_portfolio_for_user(uow, consultant, domain="health")
    assert {e.project.name for e in health} == {"H"}


@pytest.mark.unit
def test_client_sees_only_assigned():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    visible = create_project(uow, consultant, ProjectCreate(name="V", domain="legal"))
    create_project(uow, consultant, ProjectCreate(name="H", domain="health"))
    add_client_to_project(uow, consultant, visible.id, client.id)
    entries = list_portfolio_for_user(uow, client)
    assert [e.project.id for e in entries] == [visible.id]
