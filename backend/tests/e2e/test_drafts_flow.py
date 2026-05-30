import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION

_META = {
    "projeto_nome": "p",
    "documento_fonte": "d.docx",
    "data_extracao": "2026-05-21T00:00:00Z",
    "origem": "llm",
}


def _purge_users(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if not user_ids:
        return
    s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(synchronize_session=False)
    s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    s.commit()


@pytest.fixture
def consultant_and_client(client):
    s = SessionLocal()
    emails = ["e2e-drf-cons@x.com", "e2e-drf-cli@x.com"]
    try:
        _purge_users(s, emails)
        cons = User(
            email=emails[0],
            password_hash=hash_password("pwd12345678"),
            name="Cons",
            role="consultant",
        )
        cli = User(
            email=emails[1],
            password_hash=hash_password("pwd12345678"),
            name="Cli",
            role="client",
        )
        s.add_all([cons, cli])
        s.commit()
        s.refresh(cons)
        s.refresh(cli)

        def _login(email):
            return client.post(
                "/auth/login", json={"email": email, "password": "pwd12345678"}
            ).json()["access_token"]

        yield {
            "cons_token": _login(emails[0]),
            "cli_token": _login(emails[1]),
            "cli_id": str(cli.id),
        }
        _purge_users(s, emails)
    finally:
        s.close()


@pytest.mark.e2e
def test_drafts_lifecycle(client, consultant_and_client):
    h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "PDR", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        client.post(
            f"/projects/{pid}/extractions/manual",
            json={
                "content": {
                    "_meta": _META,
                    "nome_projeto": "X",
                    "escopo_planejado": "ok",
                    "status_cronograma": "atrasado",
                    "riscos_identificados": "risco x",
                }
            },
            headers=h,
        )

        r = client.post(f"/projects/{pid}/drafts/generate", headers=h)
        assert r.status_code == 201, r.text
        drafts = r.json()
        assert len(drafts) >= 3
        assert all(d["status"] == "draft" for d in drafts)
        kinds = {d["kind"] for d in drafts}
        assert kinds <= {"next_step", "attention_point"}

        # Edit
        target = drafts[0]
        r = client.patch(
            f"/drafts/{target['id']}",
            json={"title": "Editado", "body": "Corpo editado"},
            headers=h,
        )
        assert r.status_code == 200
        assert r.json()["title"] == "Editado"

        # Delete one
        other = drafts[1]
        r = client.delete(f"/drafts/{other['id']}", headers=h)
        assert r.status_code == 204
        r = client.get(f"/drafts/{other['id']}", headers=h)
        assert r.status_code == 404

        # Publish
        r = client.post(f"/drafts/{target['id']}/publish", headers=h)
        assert r.status_code == 200
        assert r.json()["status"] == "published"

        # Republish → 409
        r = client.post(f"/drafts/{target['id']}/publish", headers=h)
        assert r.status_code == 409

        # Edit after publish → 409
        r = client.patch(f"/drafts/{target['id']}", json={"body": "tarde demais"}, headers=h)
        assert r.status_code == 409

        # Delete after publish → 409
        r = client.delete(f"/drafts/{target['id']}", headers=h)
        assert r.status_code == 409
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_generate_without_extraction_400(client, consultant_and_client):
    h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "PDR2", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        r = client.post(f"/projects/{pid}/drafts/generate", headers=h)
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "no_extraction_for_draft"
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_client_only_sees_published(client, consultant_and_client):
    cons_h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {consultant_and_client['cli_token']}"}

    pid = client.post(
        "/projects",
        json={"name": "PDC", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=cons_h,
    ).json()["id"]
    try:
        client.post(
            f"/projects/{pid}/clients",
            json={"user_id": consultant_and_client["cli_id"]},
            headers=cons_h,
        )
        client.post(
            f"/projects/{pid}/extractions/manual",
            json={"content": {"_meta": _META, "nome_projeto": "X", "escopo_planejado": "x"}},
            headers=cons_h,
        )

        drafts = client.post(f"/projects/{pid}/drafts/generate", headers=cons_h).json()
        # Publish only the first
        client.post(f"/drafts/{drafts[0]['id']}/publish", headers=cons_h)

        r = client.get(f"/projects/{pid}/drafts", headers=cli_h)
        assert r.status_code == 200
        ids = {d["id"] for d in r.json()}
        assert drafts[0]["id"] in ids
        # Other drafts should not be visible to the client.
        for other in drafts[1:]:
            assert other["id"] not in ids
    finally:
        client.delete(f"/projects/{pid}", headers=cons_h)


@pytest.mark.e2e
def test_client_cannot_generate_or_publish(client, consultant_and_client):
    cons_h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {consultant_and_client['cli_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "PDR3", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=cons_h,
    ).json()["id"]
    try:
        client.post(
            f"/projects/{pid}/clients",
            json={"user_id": consultant_and_client["cli_id"]},
            headers=cons_h,
        )
        r = client.post(f"/projects/{pid}/drafts/generate", headers=cli_h)
        assert r.status_code == 403
    finally:
        client.delete(f"/projects/{pid}", headers=cons_h)
