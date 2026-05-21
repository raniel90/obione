import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal

_VALID_META_LLM = {
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
    emails = ["e2e-res-cons@x.com", "e2e-res-cli@x.com"]
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
def test_resumo_lifecycle_consultant(client, consultant_and_client):
    h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    pid = client.post("/projects", json={"name": "PR", "domain": "legal"}, headers=h).json()["id"]
    try:
        # Need an extraction first.
        client.post(
            f"/projects/{pid}/extractions/manual",
            json={"content": {**{"_meta": _VALID_META_LLM}, "nome_projeto": "Projeto Teste"}},
            headers=h,
        )

        # Generate → draft
        r = client.post(f"/projects/{pid}/resumos/generate", headers=h)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["status"] == "draft"
        assert body["llm_model"] == "mock-resumo-v1"
        resumo_id = body["id"]

        # Edit while draft
        r = client.patch(
            f"/resumos/{resumo_id}", json={"body": "Versão revisada do resumo."}, headers=h
        )
        assert r.status_code == 200
        assert r.json()["body"] == "Versão revisada do resumo."

        # Publish
        r = client.post(f"/resumos/{resumo_id}/publish", headers=h)
        assert r.status_code == 200
        assert r.json()["status"] == "published"
        assert r.json()["reviewed_at"] is not None

        # Republish rejected
        r = client.post(f"/resumos/{resumo_id}/publish", headers=h)
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "resumo_already_published"

        # Edit after publish rejected
        r = client.patch(f"/resumos/{resumo_id}", json={"body": "tarde demais"}, headers=h)
        assert r.status_code == 409
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_generate_without_extraction_400(client, consultant_and_client):
    h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    pid = client.post("/projects", json={"name": "PRN", "domain": "legal"}, headers=h).json()["id"]
    try:
        r = client.post(f"/projects/{pid}/resumos/generate", headers=h)
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "no_extraction_for_resumo"
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_client_only_sees_published(client, consultant_and_client):
    cons_h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {consultant_and_client['cli_token']}"}

    pid = client.post("/projects", json={"name": "PRC", "domain": "legal"}, headers=cons_h).json()[
        "id"
    ]
    try:
        client.post(
            f"/projects/{pid}/clients",
            json={"user_id": consultant_and_client["cli_id"]},
            headers=cons_h,
        )
        # Need an extraction.
        client.post(
            f"/projects/{pid}/extractions/manual",
            json={"content": {"_meta": _VALID_META_LLM, "nome_projeto": "X"}},
            headers=cons_h,
        )

        # Generate 2; publish only one.
        draft = client.post(f"/projects/{pid}/resumos/generate", headers=cons_h).json()
        published = client.post(f"/projects/{pid}/resumos/generate", headers=cons_h).json()
        client.post(f"/resumos/{published['id']}/publish", headers=cons_h)

        # Client list returns only the published one.
        r = client.get(f"/projects/{pid}/resumos", headers=cli_h)
        assert r.status_code == 200
        ids = [r_["id"] for r_ in r.json()]
        assert published["id"] in ids
        assert draft["id"] not in ids

        # Client GET on the draft → 404.
        r = client.get(f"/resumos/{draft['id']}", headers=cli_h)
        assert r.status_code == 404
        # Client GET on the published → 200.
        r = client.get(f"/resumos/{published['id']}", headers=cli_h)
        assert r.status_code == 200
    finally:
        client.delete(f"/projects/{pid}", headers=cons_h)


@pytest.mark.e2e
def test_client_cannot_generate_or_publish(client, consultant_and_client):
    cons_h = {"Authorization": f"Bearer {consultant_and_client['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {consultant_and_client['cli_token']}"}
    pid = client.post("/projects", json={"name": "PR2", "domain": "legal"}, headers=cons_h).json()[
        "id"
    ]
    try:
        client.post(
            f"/projects/{pid}/clients",
            json={"user_id": consultant_and_client["cli_id"]},
            headers=cons_h,
        )
        # Generate as client → forbidden via client_cannot_mutate
        r = client.post(f"/projects/{pid}/resumos/generate", headers=cli_h)
        assert r.status_code == 403
    finally:
        client.delete(f"/projects/{pid}", headers=cons_h)
