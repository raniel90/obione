import pytest

from obione.auth.models import User
from obione.documents.exceptions import (
    DuplicateDocumentError,
    FileTooLargeError,
    UnsupportedMimeTypeError,
)
from obione.documents.service import list_documents_for_project, upload_document
from obione.documents.storage.filesystem import FakeBlobStorage
from obione.projects.models import Project
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork
from tests._helpers import SAMPLE_DESCRIPTION

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _consultant() -> User:
    return User(id=new_id(), email="c@x.com", password_hash="x", name="C", role="consultant")


def _client_user() -> User:
    return User(id=new_id(), email="cl@x.com", password_hash="x", name="Cl", role="client")


def _setup_project(uow: FakeUnitOfWork) -> tuple[User, Project]:
    consultant = _consultant()
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    return consultant, project


@pytest.mark.unit
def test_upload_succeeds():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant, project = _setup_project(uow)
    doc = upload_document(
        uow,
        storage,
        consultant,
        project_id=project.id,
        filename="x.docx",
        content=b"hello",
        mime_type=DOCX_MIME,
        max_size_mb=10,
    )
    assert doc.project_id == project.id
    assert doc.sha256
    assert len(list_documents_for_project(uow, consultant, project.id)) == 1


@pytest.mark.unit
def test_upload_rejects_non_docx():
    uow = FakeUnitOfWork()
    consultant, project = _setup_project(uow)
    with pytest.raises(UnsupportedMimeTypeError):
        upload_document(
            uow,
            FakeBlobStorage(),
            consultant,
            project_id=project.id,
            filename="x.pdf",
            content=b"x",
            mime_type="application/pdf",
            max_size_mb=10,
        )


@pytest.mark.unit
def test_upload_rejects_too_large():
    uow = FakeUnitOfWork()
    consultant, project = _setup_project(uow)
    huge = b"x" * (11 * 1024 * 1024)
    with pytest.raises(FileTooLargeError):
        upload_document(
            uow,
            FakeBlobStorage(),
            consultant,
            project_id=project.id,
            filename="x.docx",
            content=huge,
            mime_type=DOCX_MIME,
            max_size_mb=10,
        )


@pytest.mark.unit
def test_upload_rejects_duplicate():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant, project = _setup_project(uow)
    upload_document(
        uow,
        storage,
        consultant,
        project_id=project.id,
        filename="a.docx",
        content=b"same",
        mime_type=DOCX_MIME,
        max_size_mb=10,
    )
    with pytest.raises(DuplicateDocumentError):
        upload_document(
            uow,
            storage,
            consultant,
            project_id=project.id,
            filename="b.docx",
            content=b"same",
            mime_type=DOCX_MIME,
            max_size_mb=10,
        )


@pytest.mark.unit
def test_client_cannot_upload():
    from obione.projects.exceptions import ClientCannotMutateError

    uow = FakeUnitOfWork()
    consultant, project = _setup_project(uow)
    client = _client_user()
    uow.projects.add_client(project.id, client.id)
    with pytest.raises(ClientCannotMutateError):
        upload_document(
            uow,
            FakeBlobStorage(),
            client,
            project_id=project.id,
            filename="x.docx",
            content=b"x",
            mime_type=DOCX_MIME,
            max_size_mb=10,
        )
