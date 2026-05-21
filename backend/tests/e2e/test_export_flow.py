import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.comments.models import Comment
from obione.projects.models import Project
from obione.shared.database import SessionLocal


def _purge_users(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if not user_ids:
        return
    project_ids = [p.id for p in s.query(Project).filter(Project.consultant_id.in_(user_ids)).all()]
    if project_ids:
        s.query(Comment).filter(Comment.project_id.in_(project_ids)).delete(
            synchronize_session=False
        )
    s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(synchronize_session=False)
    s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    s.commit()


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    email = "e2e-export@x.com"
    try:
        _purge_users(s, [email])
        u = User(
            email=email, password_hash=hash_password("pwd12345678"), name="C", role="consultant"
        )
        s.add(u)
        s.commit()
        tok = client.post("/auth/login", json={"email": email, "password": "pwd12345678"}).json()[
            "access_token"
        ]
        yield tok
        _purge_users(s, [email])
    finally:
        s.close()


@pytest.mark.e2e
def test_export_bundle_shape(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post("/projects", json={"name": "PE", "domain": "legal"}, headers=h).json()["id"]
    try:
        client.post(f"/projects/{pid}/comments", json={"body": "first comment"}, headers=h)
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "pe",
                        "documento_fonte": "x.docx",
                        "data_extracao": "2026-05-21T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "nome_projeto": "Project E",
                    "descricao": "narrative",
                    "porte": "pequeno",
                }
            },
        )
        r = client.get(f"/projects/{pid}/export", headers=h)
        assert r.status_code == 200, r.text
        bundle = r.json()
        assert bundle["schema_version"] == "1.0"
        assert bundle["project"]["id"] == pid
        assert len(bundle["comments"]) == 1
        assert len(bundle["extractions"]) == 1
        assert bundle["coverage"]["filled"] == 3
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_export_returns_404_for_unknown_project(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    bogus = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/projects/{bogus}/export", headers=h)
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "project_not_found"
