import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.comments.models import Comment
from obione.projects.models import Project
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION

_VALID_META_GAB = {
    "projeto_nome": "p",
    "documento_fonte": "d.docx",
    "data_extracao": "2026-05-21T00:00:00Z",
    "origem": "gabarito_manual",
}
_VALID_META_LLM = {**_VALID_META_GAB, "origem": "llm"}


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
    email = "e2e-detail@x.com"
    try:
        _purge_users(s, [email])
        u = User(
            email=email,
            password_hash=hash_password("pwd12345678"),
            name="C",
            role="consultant",
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
def test_detail_bare_project_empty_sections(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post(
        "/projects",
        json={"name": "PD", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        r = client.get(f"/projects/{pid}/detail", headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["project"]["id"] == pid
        assert body["documents"] == []
        assert body["latest_llm_extraction"] is None
        assert body["latest_gabarito"] is None
        assert body["evaluation"] is None
        assert body["recent_comments"] == []
        assert body["counts"] == {"documents": 0, "extractions": 0, "comments": 0}
        assert body["coverage"]["filled"] == 0
        assert body["coverage"]["total_in_scope"] == 43
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_detail_includes_evaluation_when_both_extractions_present(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post(
        "/projects",
        json={"name": "PDE", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        # llm extraction
        client.post(
            f"/projects/{pid}/extractions/manual",
            json={"content": {"_meta": _VALID_META_LLM, "nome_projeto": "X", "porte": "pequeno"}},
            headers=h,
        )
        # gabarito
        client.post(
            f"/projects/{pid}/extractions/manual",
            json={"content": {"_meta": _VALID_META_GAB, "nome_projeto": "X", "porte": "pequeno"}},
            headers=h,
        )
        # one comment
        client.post(f"/projects/{pid}/comments", json={"body": "obs"}, headers=h)

        r = client.get(f"/projects/{pid}/detail", headers=h)
        assert r.status_code == 200
        body = r.json()
        assert body["latest_llm_extraction"] is not None
        assert body["latest_gabarito"] is not None
        assert body["evaluation"] is not None
        assert body["evaluation"]["tp"] >= 2  # nome_projeto + porte
        assert body["counts"]["extractions"] == 2
        assert body["counts"]["comments"] == 1
        assert len(body["recent_comments"]) == 1
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_detail_comments_limit_query_param(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post(
        "/projects",
        json={"name": "PDC", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        for i in range(10):
            client.post(f"/projects/{pid}/comments", json={"body": f"c{i}"}, headers=h)
        r = client.get(f"/projects/{pid}/detail?comments_limit=3", headers=h)
        body = r.json()
        assert len(body["recent_comments"]) == 3
        assert body["counts"]["comments"] == 10
        # Newest first — the bodies "c9", "c8", "c7" should appear in order.
        bodies = [c["body"] for c in body["recent_comments"]]
        assert bodies == ["c9", "c8", "c7"]
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_detail_404_for_invisible_project(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    bogus = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/projects/{bogus}/detail", headers=h)
    assert r.status_code == 404


@pytest.mark.e2e
def test_detail_comments_limit_validation(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post(
        "/projects",
        json={"name": "PDV", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        r = client.get(f"/projects/{pid}/detail?comments_limit=200", headers=h)
        assert r.status_code == 422  # max 100
        r = client.get(f"/projects/{pid}/detail?comments_limit=-1", headers=h)
        assert r.status_code == 422  # min 0
    finally:
        client.delete(f"/projects/{pid}", headers=h)
