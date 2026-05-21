import io

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _purge_user(s, email: str) -> None:
    user_ids = [u.id for u in s.query(User).filter_by(email=email).all()]
    if user_ids:
        s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
            synchronize_session=False
        )
        s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        s.commit()


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    email = "e2e-docc@x.com"
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
        r = client.post(
            "/auth/login",
            json={"email": email, "password": "pwd12345678"},
        )
        yield r.json()["access_token"]
        _purge_user(s, email)
    finally:
        s.close()


@pytest.mark.e2e
def test_upload_and_list_document(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post("/projects", json={"name": "PDoc", "domain": "legal"}, headers=h)
    pid = r.json()["id"]
    try:
        files = {"file": ("test.docx", io.BytesIO(b"fake docx content"), DOCX_MIME)}
        r = client.post(f"/projects/{pid}/documents", headers=h, files=files)
        assert r.status_code == 201, r.text
        assert r.json()["original_name"] == "test.docx"

        r = client.get(f"/projects/{pid}/documents", headers=h)
        assert len(r.json()) == 1
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_upload_rejects_pdf(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post("/projects", json={"name": "PDoc2", "domain": "legal"}, headers=h)
    pid = r.json()["id"]
    try:
        files = {"file": ("evil.pdf", io.BytesIO(b"%PDF"), "application/pdf")}
        r = client.post(f"/projects/{pid}/documents", headers=h, files=files)
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "unsupported_mime_type"
    finally:
        client.delete(f"/projects/{pid}", headers=h)
