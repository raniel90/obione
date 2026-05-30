"""POST /projects/{id}/extractions reads project.description as source."""

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project, ProjectClient
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION


def _purge_users(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if not user_ids:
        return
    s.query(ProjectClient).filter(ProjectClient.user_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(synchronize_session=False)
    s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    s.commit()


@pytest.fixture
def consultant_and_client_pair(client):
    s = SessionLocal()
    emails = ["e2e-ext-desc-cons@x.com", "e2e-ext-desc-cli@x.com"]
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
def test_consultant_creates_project_and_extracts_from_description(
    client, consultant_and_client_pair
):
    h = {"Authorization": f"Bearer {consultant_and_client_pair['cons_token']}"}
    pid = client.post(
        "/projects",
        headers=h,
        json={"name": "Caso X", "domain": "legal", "description": SAMPLE_DESCRIPTION},
    ).json()["id"]

    r = client.post(f"/projects/{pid}/extractions", headers=h)
    assert r.status_code == 201, r.text
    body = r.json()
    assert "content" in body
    assert "_meta" in body["content"]


@pytest.mark.e2e
def test_client_forbidden_to_trigger_extraction(client, consultant_and_client_pair):
    h_cons = {"Authorization": f"Bearer {consultant_and_client_pair['cons_token']}"}
    h_cli = {"Authorization": f"Bearer {consultant_and_client_pair['cli_token']}"}

    pid = client.post(
        "/projects",
        headers=h_cons,
        json={"name": "Caso Y", "domain": "health", "description": SAMPLE_DESCRIPTION},
    ).json()["id"]
    # Vincula o cliente ao projeto para que ele exista no escopo de visibilidade
    client.post(
        f"/projects/{pid}/clients",
        headers=h_cons,
        json={"user_id": consultant_and_client_pair["cli_id"]},
    )

    r = client.post(f"/projects/{pid}/extractions", headers=h_cli)
    assert r.status_code == 403
