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
    project_ids = [
        p.id for p in s.query(Project).filter(Project.consultant_id.in_(user_ids)).all()
    ]
    if project_ids:
        s.query(Comment).filter(Comment.project_id.in_(project_ids)).delete(
            synchronize_session=False
        )
    s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    s.commit()


@pytest.fixture
def consultant_and_client(client):
    s = SessionLocal()
    emails = ["e2e-cons-c@x.com", "e2e-cli-c@x.com"]
    try:
        _purge_users(s, emails)
        cons = User(email=emails[0], password_hash=hash_password("pwd12345678"),
                    name="C", role="consultant")
        cli = User(email=emails[1], password_hash=hash_password("pwd12345678"),
                   name="Cl", role="client")
        s.add_all([cons, cli]); s.commit()
        s.refresh(cons); s.refresh(cli)
        cons_tok = client.post("/auth/login",
                               json={"email": emails[0], "password": "pwd12345678"}).json()["access_token"]
        cli_tok = client.post("/auth/login",
                              json={"email": emails[1], "password": "pwd12345678"}).json()["access_token"]
        yield {
            "consultant_id": str(cons.id), "client_id": str(cli.id),
            "consultant_token": cons_tok, "client_token": cli_tok,
        }
        _purge_users(s, emails)
    finally:
        s.close()


@pytest.mark.e2e
def test_comment_create_list_reply(client, consultant_and_client):
    ctok = consultant_and_client["consultant_token"]
    h = {"Authorization": f"Bearer {ctok}"}
    pid = client.post("/projects", json={"name": "PC", "domain": "legal"}, headers=h).json()["id"]
    try:
        r = client.post(f"/projects/{pid}/comments", json={"body": "primeira"}, headers=h)
        assert r.status_code == 201, r.text
        parent_id = r.json()["id"]

        r = client.post(
            f"/projects/{pid}/comments",
            json={"body": "resposta", "parent_id": parent_id},
            headers=h,
        )
        assert r.status_code == 201
        assert r.json()["parent_id"] == parent_id

        r = client.get(f"/projects/{pid}/comments", headers=h)
        assert r.status_code == 200
        assert len(r.json()) == 2
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_client_assigned_can_post_and_consultant_moderates(client, consultant_and_client):
    ctok = consultant_and_client["consultant_token"]
    cltok = consultant_and_client["client_token"]
    h_c = {"Authorization": f"Bearer {ctok}"}
    h_cli = {"Authorization": f"Bearer {cltok}"}
    pid = client.post("/projects", json={"name": "PCM", "domain": "legal"}, headers=h_c).json()["id"]
    try:
        client.post(
            f"/projects/{pid}/clients",
            json={"user_id": consultant_and_client["client_id"]}, headers=h_c,
        )
        r = client.post(
            f"/projects/{pid}/comments", json={"body": "dúvida do cliente"}, headers=h_cli
        )
        assert r.status_code == 201, r.text
        comment_id = r.json()["id"]

        # Client can't delete a comment they didn't write — but they CAN
        # delete their own. Try the moderation path: consultant deletes.
        r = client.delete(f"/comments/{comment_id}", headers=h_c)
        assert r.status_code == 204
        r = client.get(f"/projects/{pid}/comments", headers=h_cli)
        assert r.json() == []
    finally:
        client.delete(f"/projects/{pid}", headers=h_c)


@pytest.mark.e2e
def test_non_author_cannot_edit(client, consultant_and_client):
    ctok = consultant_and_client["consultant_token"]
    cltok = consultant_and_client["client_token"]
    h_c = {"Authorization": f"Bearer {ctok}"}
    h_cli = {"Authorization": f"Bearer {cltok}"}
    pid = client.post("/projects", json={"name": "PNE", "domain": "legal"}, headers=h_c).json()["id"]
    try:
        client.post(
            f"/projects/{pid}/clients",
            json={"user_id": consultant_and_client["client_id"]}, headers=h_c,
        )
        cid = client.post(
            f"/projects/{pid}/comments", json={"body": "do consultor"}, headers=h_c
        ).json()["id"]
        r = client.patch(f"/comments/{cid}", json={"body": "hack"}, headers=h_cli)
        assert r.status_code == 403
        assert r.json()["error"]["code"] == "not_comment_author"
    finally:
        client.delete(f"/projects/{pid}", headers=h_c)


@pytest.mark.e2e
def test_reply_to_reply_400(client, consultant_and_client):
    ctok = consultant_and_client["consultant_token"]
    h = {"Authorization": f"Bearer {ctok}"}
    pid = client.post("/projects", json={"name": "PRR", "domain": "legal"}, headers=h).json()["id"]
    try:
        parent_id = client.post(
            f"/projects/{pid}/comments", json={"body": "p"}, headers=h
        ).json()["id"]
        reply_id = client.post(
            f"/projects/{pid}/comments",
            json={"body": "r", "parent_id": parent_id}, headers=h,
        ).json()["id"]
        r = client.post(
            f"/projects/{pid}/comments",
            json={"body": "r2", "parent_id": reply_id}, headers=h,
        )
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "cannot_reply_to_reply"
    finally:
        client.delete(f"/projects/{pid}", headers=h)
