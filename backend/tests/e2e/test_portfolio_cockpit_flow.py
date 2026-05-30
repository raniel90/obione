"""End-to-end RF20 (cockpit cross-cliente)."""

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
def cockpit_actors(client):
    s = SessionLocal()
    emails = ["e2e-cp-cons@x.com", "e2e-cp-cli@x.com"]
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
        }
        _purge_users(s, emails)
    finally:
        s.close()


@pytest.mark.e2e
def test_consultant_sees_breakdown_by_theme(client, cockpit_actors):
    h = {"Authorization": f"Bearer {cockpit_actors['cons_token']}"}
    for name, domain in [("L1", "legal"), ("L2", "legal"), ("H1", "health")]:
        client.post(
            "/projects",
            json={"name": name, "domain": domain, "description": SAMPLE_DESCRIPTION},
            headers=h,
        )

    r = client.get("/portfolio/cockpit", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["total_projects"] == 3
    domains = {t["domain"]: t for t in body["themes"]}
    assert domains["legal"]["count"] == 2
    assert domains["health"]["count"] == 1


@pytest.mark.e2e
def test_client_blocked_from_cockpit(client, cockpit_actors):
    h = {"Authorization": f"Bearer {cockpit_actors['cli_token']}"}
    r = client.get("/portfolio/cockpit", headers=h)
    assert r.status_code == 403


@pytest.mark.e2e
def test_cockpit_by_theme_endpoint(client, cockpit_actors):
    h = {"Authorization": f"Bearer {cockpit_actors['cons_token']}"}
    client.post(
        "/projects",
        json={"name": "OnlyLegal", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    )
    r = client.get("/portfolio/cockpit/themes/legal", headers=h)
    assert r.status_code == 200
    assert r.json()["count"] == 1

    r404 = client.get("/portfolio/cockpit/themes/gastronomy", headers=h)
    assert r404.status_code == 404
