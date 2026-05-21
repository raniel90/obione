import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal


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
    email = "e2e-ext@x.com"
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
def test_create_manual_then_list(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post("/projects", json={"name": "PExt", "domain": "legal"}, headers=h)
    pid = r.json()["id"]
    try:
        r = client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "p",
                        "documento_fonte": "d.docx",
                        "data_extracao": "2026-05-21T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "nome_projeto": "Manual",
                }
            },
        )
        assert r.status_code == 201, r.text
        assert r.json()["source"] == "manual"

        r = client.get(f"/projects/{pid}/extractions", headers=h)
        assert len(r.json()) == 1
    finally:
        client.delete(f"/projects/{pid}", headers=h)
