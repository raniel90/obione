import io

import pytest
from docx import Document as DocxDocument

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.settings import settings
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION

pytestmark = pytest.mark.skip(
    reason="documents/ context removed in M1.4; this file will be deleted then."
)

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@pytest.fixture(autouse=True)
def _force_mock_provider(monkeypatch):
    """Pin LLM_PROVIDER=mock for these e2e tests so they don't depend on
    Ollama being reachable. Manual smoke covers the real provider path."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")


def _purge_user(s, email: str) -> None:
    user_ids = [u.id for u in s.query(User).filter_by(email=email).all()]
    if user_ids:
        s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
            synchronize_session=False
        )
        s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        s.commit()


def _real_docx_bytes(paragraphs: list[str]) -> bytes:
    doc = DocxDocument()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    email = "e2e-pipe@x.com"
    try:
        _purge_user(s, email)
        u = User(
            email=email,
            password_hash=hash_password("pwd12345678"),
            name="C",
            role="consultant",
        )
        s.add(u)
        s.commit()
        r = client.post("/auth/login", json={"email": email, "password": "pwd12345678"})
        yield r.json()["access_token"]
        _purge_user(s, email)
    finally:
        s.close()


@pytest.mark.e2e
def test_extract_from_uploaded_document(client, consultant_token):
    """Full happy path: upload .docx → trigger from-document extraction.

    Provider is mock (default LLM_PROVIDER=mock), so the result is the
    Valença example mounted at /app/atividades.
    """
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post(
        "/projects",
        json={"name": "PPipe", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    )
    pid = r.json()["id"]
    try:
        files = {
            "file": (
                "v.docx",
                io.BytesIO(_real_docx_bytes(["Conteudo do projeto Valença."])),
                DOCX_MIME,
            )
        }
        r = client.post(f"/projects/{pid}/documents", headers=h, files=files)
        assert r.status_code == 201, r.text
        doc_id = r.json()["id"]

        r = client.post(f"/projects/{pid}/extractions/from-document/{doc_id}", headers=h)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["source"] == "llm"
        assert body["llm_model"] == "mock"
        assert "_meta" in body["content"]
        # Mock returns the Valença example file:
        assert body["content"]["_meta"]["projeto_nome"] == "valenca-odontologia"

        # Listing should now include this extraction
        r = client.get(f"/projects/{pid}/extractions", headers=h)
        assert any(x["source"] == "llm" for x in r.json())
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_extract_returns_404_for_unknown_document(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post(
        "/projects",
        json={"name": "PPipe2", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    )
    pid = r.json()["id"]
    try:
        bogus = "00000000-0000-0000-0000-000000000000"
        r = client.post(f"/projects/{pid}/extractions/from-document/{bogus}", headers=h)
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "extraction_not_found"
    finally:
        client.delete(f"/projects/{pid}", headers=h)
