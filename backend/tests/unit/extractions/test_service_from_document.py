import pytest

from obione.auth.models import User
from obione.documents.models import Document
from obione.documents.storage.filesystem import FakeBlobStorage
from obione.extractions.exceptions import ExtractionNotFoundError
from obione.extractions.llm.port import ExtractionResult
from obione.extractions.service import create_extraction_from_document
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import (
    add_client_to_project,
    create_project,
)
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


class _CannedExtractor:
    """Records the bytes it was given so we can assert the storage round-trip."""

    def __init__(self):
        self.received_bytes: bytes | None = None

    def extract(self, b: bytes) -> ExtractionResult:
        self.received_bytes = b
        return ExtractionResult(
            content={"_meta": {"projeto_nome": "p"}, "nome_projeto": "Canned"},
            model_id="canned",
        )


def _consultant() -> User:
    return User(id=new_id(), email="c@x.com", password_hash="x", name="C", role="consultant")


def _client_user() -> User:
    return User(id=new_id(), email="cl@x.com", password_hash="x", name="Cl", role="client")


def _seed_doc(uow, storage, project_id, *, uploader_id):
    sha, rel = storage.write(project_id, b"docx-bytes")
    doc = Document(
        project_id=project_id,
        original_name="d.docx",
        relative_path=rel,
        sha256=sha,
        size_bytes=10,
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploaded_by=uploader_id,
    )
    uow.documents.add(doc)
    return doc


@pytest.mark.unit
def test_create_from_document_reads_storage_and_persists():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    doc = _seed_doc(uow, storage, project.id, uploader_id=consultant.id)

    extractor = _CannedExtractor()
    extraction = create_extraction_from_document(
        uow,
        storage,
        extractor,
        consultant,
        project_id=project.id,
        document_id=doc.id,
    )

    assert extractor.received_bytes == b"docx-bytes"
    assert extraction.source == "llm"
    assert extraction.llm_model == "canned"
    assert extraction.document_id == doc.id
    assert extraction.content["nome_projeto"] == "Canned"


@pytest.mark.unit
def test_create_from_document_404_when_document_in_other_project():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant = _consultant()
    p1 = create_project(uow, consultant, ProjectCreate(name="P1", domain="legal"))
    p2 = create_project(uow, consultant, ProjectCreate(name="P2", domain="health"))
    doc_in_p2 = _seed_doc(uow, storage, p2.id, uploader_id=consultant.id)

    with pytest.raises(ExtractionNotFoundError):
        create_extraction_from_document(
            uow,
            storage,
            _CannedExtractor(),
            consultant,
            project_id=p1.id,
            document_id=doc_in_p2.id,
        )


@pytest.mark.unit
def test_create_from_document_404_when_document_missing():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))

    with pytest.raises(ExtractionNotFoundError):
        create_extraction_from_document(
            uow,
            storage,
            _CannedExtractor(),
            consultant,
            project_id=project.id,
            document_id=new_id(),
        )


@pytest.mark.unit
def test_create_from_document_forbidden_for_client():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant = _consultant()
    client = _client_user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    doc = _seed_doc(uow, storage, project.id, uploader_id=consultant.id)
    add_client_to_project(uow, consultant, project.id, client.id)

    with pytest.raises(ClientCannotMutateError):
        create_extraction_from_document(
            uow,
            storage,
            _CannedExtractor(),
            client,
            project_id=project.id,
            document_id=doc.id,
        )
