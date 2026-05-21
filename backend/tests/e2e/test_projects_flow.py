import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal


def _purge_test_users(s, emails: list[str]) -> None:
    """Delete users + their projects (cascades to project_clients)."""
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if user_ids:
        s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
            synchronize_session=False
        )
        s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        s.commit()


@pytest.fixture
def seeded_users():
    """Create consultant + client for tests; cleanup after."""
    s = SessionLocal()
    emails = ["e2e-c@x.com", "e2e-cl@x.com"]
    try:
        _purge_test_users(s, emails)
        consultant = User(
            email="e2e-c@x.com",
            password_hash=hash_password("pwd1234567"),
            name="C",
            role="consultant",
        )
        client_user = User(
            email="e2e-cl@x.com",
            password_hash=hash_password("pwd1234567"),
            name="Cl",
            role="client",
        )
        s.add_all([consultant, client_user])
        s.commit()
        s.refresh(consultant)
        s.refresh(client_user)
        yield {"consultant": consultant, "client": client_user}
        _purge_test_users(s, emails)
    finally:
        s.close()


def _login(client, email: str, password: str) -> str:
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.mark.e2e
def test_consultant_creates_and_lists_project(client, seeded_users):
    token = _login(client, "e2e-c@x.com", "pwd1234567")
    h = {"Authorization": f"Bearer {token}"}
    r = client.post("/projects", json={"name": "P", "domain": "legal"}, headers=h)
    assert r.status_code == 201, r.text
    project_id = r.json()["id"]
    r = client.get("/projects", headers=h)
    assert r.status_code == 200
    assert any(p["id"] == project_id for p in r.json())

    client.delete(f"/projects/{project_id}", headers=h)


@pytest.mark.e2e
def test_client_cannot_see_unassigned_project(client, seeded_users):
    consultant_tok = _login(client, "e2e-c@x.com", "pwd1234567")
    client_tok = _login(client, "e2e-cl@x.com", "pwd1234567")
    r = client.post(
        "/projects",
        json={"name": "Hidden", "domain": "health"},
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )
    project_id = r.json()["id"]
    r = client.get("/projects", headers={"Authorization": f"Bearer {client_tok}"})
    assert all(p["id"] != project_id for p in r.json())
    r = client.get(f"/projects/{project_id}", headers={"Authorization": f"Bearer {client_tok}"})
    assert r.status_code == 404
    client.delete(
        f"/projects/{project_id}",
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )


@pytest.mark.e2e
def test_client_sees_assigned_project_after_add(client, seeded_users):
    consultant_tok = _login(client, "e2e-c@x.com", "pwd1234567")
    client_tok = _login(client, "e2e-cl@x.com", "pwd1234567")
    client_user_id = str(seeded_users["client"].id)

    r = client.post(
        "/projects",
        json={"name": "Shared", "domain": "branding"},
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )
    project_id = r.json()["id"]

    client.post(
        f"/projects/{project_id}/clients",
        json={"user_id": client_user_id},
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )

    r = client.get("/projects", headers={"Authorization": f"Bearer {client_tok}"})
    assert any(p["id"] == project_id for p in r.json())

    r = client.patch(
        f"/projects/{project_id}",
        json={"name": "Renamed"},
        headers={"Authorization": f"Bearer {client_tok}"},
    )
    assert r.status_code == 403

    client.delete(
        f"/projects/{project_id}",
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )
