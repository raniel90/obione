import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.shared.database import SessionLocal


@pytest.fixture
def admin_user():
    """Create an admin directly via SessionLocal (outside the rollback fixture)."""
    s = SessionLocal()
    try:
        existing = s.query(User).filter_by(email="e2e-admin@x.com").first()
        if existing:
            s.delete(existing)
            s.commit()
        u = User(
            email="e2e-admin@x.com",
            password_hash=hash_password("admin-pwd-1234"),
            name="E2E Admin",
            role="admin",
        )
        s.add(u)
        s.commit()
        yield u
        s.query(User).filter_by(email="e2e-admin@x.com").delete()
        s.commit()
    finally:
        s.close()


@pytest.mark.e2e
def test_login_returns_token(client, admin_user):
    r = client.post(
        "/auth/login",
        json={"email": "e2e-admin@x.com", "password": "admin-pwd-1234"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.e2e
def test_login_wrong_password_401(client, admin_user):
    r = client.post(
        "/auth/login",
        json={"email": "e2e-admin@x.com", "password": "wrong"},
    )
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"


@pytest.mark.e2e
def test_me_requires_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


@pytest.mark.e2e
def test_full_login_then_me(client, admin_user):
    r = client.post(
        "/auth/login",
        json={"email": "e2e-admin@x.com", "password": "admin-pwd-1234"},
    )
    token = r.json()["access_token"]
    r2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200, r2.text
    assert r2.json()["email"] == "e2e-admin@x.com"
    assert r2.json()["role"] == "admin"


@pytest.mark.e2e
def test_create_user_requires_admin(client, admin_user):
    login = client.post(
        "/auth/login", json={"email": "e2e-admin@x.com", "password": "admin-pwd-1234"}
    )
    token = login.json()["access_token"]
    r = client.post(
        "/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "new-consultant@x.com",
            "password": "newpwd1234",
            "name": "New Consultant",
            "role": "consultant",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["email"] == "new-consultant@x.com"

    s = SessionLocal()
    try:
        s.query(User).filter_by(email="new-consultant@x.com").delete()
        s.commit()
    finally:
        s.close()


@pytest.fixture
def consultant_and_client():
    """Create a consultant + a client directly (outside the rollback fixture)."""
    emails = ["e2e-consult@x.com", "e2e-cli@x.com"]
    s = SessionLocal()
    try:
        s.query(User).filter(User.email.in_(emails)).delete(synchronize_session=False)
        s.commit()
        consultant = User(
            email="e2e-consult@x.com",
            password_hash=hash_password("consultpwd1234"),
            name="Zeta Consultant",
            role="consultant",
        )
        client_user = User(
            email="e2e-cli@x.com",
            password_hash=hash_password("clientpwd1234"),
            name="Alfa Client",
            role="client",
        )
        s.add_all([consultant, client_user])
        s.commit()
        yield {"consultant": "e2e-consult@x.com", "client": "e2e-cli@x.com"}
        s.query(User).filter(User.email.in_(emails)).delete(synchronize_session=False)
        s.commit()
    finally:
        s.close()


def _token(client, email, password):
    return client.post("/auth/login", json={"email": email, "password": password}).json()[
        "access_token"
    ]


@pytest.mark.e2e
def test_list_users_filtered_by_role_returns_only_clients(client, consultant_and_client):
    token = _token(client, "e2e-consult@x.com", "consultpwd1234")
    r = client.get(
        "/auth/users", params={"role": "client"}, headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 200, r.text
    roles = {u["role"] for u in r.json()}
    assert roles == {"client"}
    emails = {u["email"] for u in r.json()}
    assert "e2e-cli@x.com" in emails
    assert "e2e-consult@x.com" not in emails
    # UserResponse shape (no password leak)
    sample = r.json()[0]
    assert set(sample) >= {"id", "email", "name", "role", "created_at"}
    assert "password_hash" not in sample


@pytest.mark.e2e
def test_list_users_without_role_returns_all(client, consultant_and_client):
    token = _token(client, "e2e-consult@x.com", "consultpwd1234")
    r = client.get("/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    emails = {u["email"] for u in r.json()}
    assert {"e2e-consult@x.com", "e2e-cli@x.com"} <= emails


@pytest.mark.e2e
def test_list_users_forbidden_for_client(client, consultant_and_client):
    token = _token(client, "e2e-cli@x.com", "clientpwd1234")
    r = client.get("/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
