import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.comments.models import Comment
from obione.projects.models import Project
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION


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
def two_consultants(client):
    s = SessionLocal()
    emails = ["e2e-feed-a@x.com", "e2e-feed-b@x.com"]
    try:
        _purge_users(s, emails)
        a = User(
            email=emails[0], password_hash=hash_password("pwd12345678"), name="A", role="consultant"
        )
        b = User(
            email=emails[1], password_hash=hash_password("pwd12345678"), name="B", role="consultant"
        )
        s.add_all([a, b])
        s.commit()
        a_tok = client.post(
            "/auth/login", json={"email": emails[0], "password": "pwd12345678"}
        ).json()["access_token"]
        b_tok = client.post(
            "/auth/login", json={"email": emails[1], "password": "pwd12345678"}
        ).json()["access_token"]
        yield {"a_token": a_tok, "b_token": b_tok}
        _purge_users(s, emails)
    finally:
        s.close()


@pytest.mark.e2e
def test_feed_shows_events_for_own_projects_only(client, two_consultants):
    h_a = {"Authorization": f"Bearer {two_consultants['a_token']}"}
    h_b = {"Authorization": f"Bearer {two_consultants['b_token']}"}

    pid_a = client.post(
        "/projects",
        json={"name": "FA", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h_a,
    ).json()["id"]
    pid_b = client.post(
        "/projects",
        json={"name": "FB", "domain": "health", "description": SAMPLE_DESCRIPTION},
        headers=h_b,
    ).json()["id"]
    try:
        client.post(f"/projects/{pid_a}/comments", json={"body": "em A"}, headers=h_a)
        client.post(f"/projects/{pid_b}/comments", json={"body": "em B"}, headers=h_b)
        client.post(
            f"/projects/{pid_a}/extractions/manual",
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "fa",
                        "documento_fonte": "x.docx",
                        "data_extracao": "2026-05-21T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "nome_projeto": "FA",
                }
            },
            headers=h_a,
        )

        r = client.get("/feed", headers=h_a)
        assert r.status_code == 200, r.text
        events = r.json()["events"]
        kinds = {e["kind"] for e in events}
        project_ids = {e["project_id"] for e in events}
        assert "new_comment" in kinds
        assert "new_extraction" in kinds
        assert pid_a in project_ids
        assert pid_b not in project_ids
    finally:
        client.delete(f"/projects/{pid_a}", headers=h_a)
        client.delete(f"/projects/{pid_b}", headers=h_b)


@pytest.mark.e2e
def test_feed_limit_query_param(client, two_consultants):
    h = {"Authorization": f"Bearer {two_consultants['a_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "FL", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        for i in range(6):
            client.post(f"/projects/{pid}/comments", json={"body": f"c{i}"}, headers=h)
        r = client.get("/feed?limit=3", headers=h)
        assert r.status_code == 200
        assert len(r.json()["events"]) == 3
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_feed_empty_for_user_with_no_projects(client, two_consultants):
    """B has no projects of their own and isn't assigned to any."""
    s = SessionLocal()
    try:
        # Make sure B has no projects.
        _purge_users(s, ["e2e-feed-b@x.com"])
        # Recreate B so token is still valid... actually token's user_id is
        # gone now. Create a fresh client user with a new token.
        email = "e2e-feed-empty@x.com"
        _purge_users(s, [email])
        u = User(
            email=email, password_hash=hash_password("pwd12345678"), name="Empty", role="client"
        )
        s.add(u)
        s.commit()
        tok = client.post("/auth/login", json={"email": email, "password": "pwd12345678"}).json()[
            "access_token"
        ]
        r = client.get("/feed", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json() == {"events": []}
        _purge_users(s, [email])
    finally:
        s.close()
