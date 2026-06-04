"""End-to-end Conectora (cross-project synthesis per temática)."""

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project, ProjectClient
from obione.shared.database import SessionLocal
from obione.synthesis.models import Synthesis
from tests._helpers import SAMPLE_DESCRIPTION

_META = {
    "projeto_nome": "p",
    "documento_fonte": "d.docx",
    "data_extracao": "2026-05-21T00:00:00Z",
    "origem": "llm",
}


def _purge(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if not user_ids:
        return
    # Syntheses are domain-keyed (no project FK) — clean the ones these users made.
    s.query(Synthesis).filter(Synthesis.generated_by.in_(user_ids)).delete(
        synchronize_session=False
    )
    project_ids = [p.id for p in s.query(Project).filter(Project.consultant_id.in_(user_ids)).all()]
    if project_ids:
        s.query(ProjectClient).filter(ProjectClient.project_id.in_(project_ids)).delete(
            synchronize_session=False
        )
    s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(synchronize_session=False)
    s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    s.commit()


@pytest.fixture
def actors(client):
    s = SessionLocal()
    emails = ["e2e-syn-cons@x.com", "e2e-syn-cli@x.com"]
    try:
        _purge(s, emails)
        cons = User(
            email=emails[0],
            password_hash=hash_password("pwd12345678"),
            name="Cons",
            role="consultant",
        )
        cli = User(
            email=emails[1], password_hash=hash_password("pwd12345678"), name="Cli", role="client"
        )
        s.add_all([cons, cli])
        s.commit()
        s.refresh(cli)

        def _login(email):
            return client.post(
                "/auth/login", json={"email": email, "password": "pwd12345678"}
            ).json()["access_token"]

        yield {"cons": _login(emails[0]), "cli": _login(emails[1]), "cli_id": str(cli.id)}
        _purge(s, emails)
    finally:
        s.close()


def _make_legal_project(client, h, name, **lessons):
    pid = client.post(
        "/projects",
        json={"name": name, "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    content = {"_meta": _META, "nome_projeto": name, **lessons}
    client.post(f"/projects/{pid}/extractions/manual", json={"content": content}, headers=h)
    return pid


@pytest.mark.e2e
def test_synthesis_lifecycle_and_client_read(client, actors):
    h = {"Authorization": f"Bearer {actors['cons']}"}
    cli_h = {"Authorization": f"Bearer {actors['cli']}"}

    p1 = _make_legal_project(client, h, "Alfa ADV", pontos_fortes="comunicação clara")
    _make_legal_project(client, h, "Beta ADV Secreto XPTO", riscos_identificados="prazo apertado")
    client.post(f"/projects/{p1}/clients", json={"user_id": actors["cli_id"]}, headers=h)

    # Generate → draft.
    r = client.post("/themes/legal/syntheses/generate", headers=h)
    assert r.status_code == 201, r.text
    syn = r.json()
    assert syn["status"] == "draft"
    assert syn["domain"] == "legal"
    assert len(syn["source_project_ids"]) == 2
    # Anonymisation: no client/project name leaks into the body.
    assert "Beta ADV Secreto XPTO" not in syn["body"]
    assert "XPTO" not in syn["body"]

    # Edit while draft.
    r = client.patch(
        f"/syntheses/{syn['id']}", json={"body": "Síntese revisada pelo consultor."}, headers=h
    )
    assert r.status_code == 200

    # Client does not see drafts.
    r = client.get(f"/projects/{p1}/syntheses", headers=cli_h)
    assert r.status_code == 200
    assert syn["id"] not in {s["id"] for s in r.json()}

    # Publish → immutable.
    r = client.post(f"/syntheses/{syn['id']}/publish", headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "published"

    # Client now reads the published synthesis of its project's temática.
    r = client.get(f"/projects/{p1}/syntheses", headers=cli_h)
    assert r.status_code == 200
    published = {s["id"] for s in r.json()}
    assert syn["id"] in published

    # Immutability after publish.
    assert client.post(f"/syntheses/{syn['id']}/publish", headers=h).status_code == 409
    assert (
        client.patch(f"/syntheses/{syn['id']}", json={"body": "tarde"}, headers=h).status_code
        == 409
    )
    assert client.delete(f"/syntheses/{syn['id']}", headers=h).status_code == 409


@pytest.mark.e2e
def test_client_cannot_generate_or_list_theme(client, actors):
    h = {"Authorization": f"Bearer {actors['cons']}"}
    cli_h = {"Authorization": f"Bearer {actors['cli']}"}
    _make_legal_project(client, h, "Alfa ADV", pontos_fortes="x")

    assert client.post("/themes/legal/syntheses/generate", headers=cli_h).status_code == 403
    assert client.get("/themes/legal/syntheses", headers=cli_h).status_code == 403
