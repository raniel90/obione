"""End-to-end RF19 (sugestão de temática)."""

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project, ProjectClient
from obione.shared.database import SessionLocal


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
def themes_actors(client):
    s = SessionLocal()
    emails = ["e2e-th-cons@x.com", "e2e-th-cli@x.com"]
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


_LEGAL_DESC = (
    "Atendimento jurídico contínuo para um escritório de advocacia em Pernambuco, "
    "envolvendo a gestão de processos judiciais, contratos e atendimento de clientes "
    "do tribunal. O projeto cobre toda a operação do advogado titular. "
) * 2


@pytest.mark.e2e
def test_consultant_suggests_then_accepts(client, themes_actors):
    h = {"Authorization": f"Bearer {themes_actors['cons_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "ProjTheme", "domain": "other", "description": _LEGAL_DESC},
        headers=h,
    ).json()["id"]

    r = client.post(f"/projects/{pid}/themes/suggest", headers=h)
    assert r.status_code == 201, r.text
    suggestion = r.json()
    assert suggestion["suggested_domain"] == "legal"
    assert suggestion["accepted"] is False

    accepted = client.post(f"/themes/suggestions/{suggestion['id']}/accept", headers=h).json()
    assert accepted["accepted"] is True
    assert accepted["suggested_domain"] == "legal"

    project = client.get(f"/projects/{pid}", headers=h).json()
    assert project["domain"] == "legal"


@pytest.mark.e2e
def test_list_suggestions_returns_trail(client, themes_actors):
    h = {"Authorization": f"Bearer {themes_actors['cons_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "ProjThemeList", "domain": "other", "description": _LEGAL_DESC},
        headers=h,
    ).json()["id"]
    client.post(f"/projects/{pid}/themes/suggest", headers=h)
    client.post(f"/projects/{pid}/themes/suggest", headers=h)

    r = client.get(f"/projects/{pid}/themes/suggestions", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 2


@pytest.mark.e2e
def test_client_forbidden_to_suggest_or_list(client, themes_actors):
    cons_h = {"Authorization": f"Bearer {themes_actors['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {themes_actors['cli_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "ProjThemeFor", "domain": "other", "description": _LEGAL_DESC},
        headers=cons_h,
    ).json()["id"]
    client.post(
        f"/projects/{pid}/clients",
        json={"user_id": themes_actors["cli_id"]},
        headers=cons_h,
    )

    r = client.post(f"/projects/{pid}/themes/suggest", headers=cli_h)
    assert r.status_code == 403

    r = client.get(f"/projects/{pid}/themes/suggestions", headers=cli_h)
    assert r.status_code == 403
