import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal


def _purge_users(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if user_ids:
        s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
            synchronize_session=False
        )
        s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        s.commit()


@pytest.fixture
def tokens(client):
    s = SessionLocal()
    emails = ["e2e-port-c@x.com", "e2e-port-cli@x.com"]
    try:
        _purge_users(s, emails)
        c = User(
            email=emails[0], password_hash=hash_password("pwd12345678"), name="C", role="consultant"
        )
        cli = User(
            email=emails[1], password_hash=hash_password("pwd12345678"), name="Cl", role="client"
        )
        s.add_all([c, cli])
        s.commit()
        c_tok = client.post(
            "/auth/login", json={"email": emails[0], "password": "pwd12345678"}
        ).json()["access_token"]
        cli_tok = client.post(
            "/auth/login", json={"email": emails[1], "password": "pwd12345678"}
        ).json()["access_token"]
        yield {"consultant_token": c_tok, "client_token": cli_tok}
        _purge_users(s, emails)
    finally:
        s.close()


@pytest.mark.e2e
def test_portfolio_shows_status_progression(client, tokens):
    h = {"Authorization": f"Bearer {tokens['consultant_token']}"}
    p1 = client.post("/projects", json={"name": "Bare", "domain": "legal"}, headers=h).json()["id"]
    p2 = client.post(
        "/projects", json={"name": "WithExtraction", "domain": "health"}, headers=h
    ).json()["id"]
    try:
        # p2 gets a manual extraction → status 'reviewed'
        client.post(
            f"/projects/{p2}/extractions/manual",
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "x",
                        "documento_fonte": "x.docx",
                        "data_extracao": "2026-05-21T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "nome_projeto": "WithExtraction",
                }
            },
            headers=h,
        )
        r = client.get("/projects/portfolio", headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        by_id = {e["id"]: e for e in body}
        assert by_id[p1]["status"] == "registered"
        assert by_id[p1]["coverage_percentage"] == 0.0
        assert by_id[p1]["has_gabarito"] is False
        assert by_id[p2]["status"] == "reviewed"
        assert by_id[p2]["has_gabarito"] is True
        assert by_id[p2]["coverage_percentage"] > 0.0
    finally:
        client.delete(f"/projects/{p1}", headers=h)
        client.delete(f"/projects/{p2}", headers=h)


@pytest.mark.e2e
def test_portfolio_domain_filter(client, tokens):
    h = {"Authorization": f"Bearer {tokens['consultant_token']}"}
    p_legal = client.post("/projects", json={"name": "L1", "domain": "legal"}, headers=h).json()[
        "id"
    ]
    p_health = client.post("/projects", json={"name": "H1", "domain": "health"}, headers=h).json()[
        "id"
    ]
    try:
        r = client.get("/projects/portfolio?domain=legal", headers=h)
        assert r.status_code == 200
        domains = {e["domain"] for e in r.json()}
        assert domains == {"legal"}
        ids = {e["id"] for e in r.json()}
        assert p_legal in ids
        assert p_health not in ids
    finally:
        client.delete(f"/projects/{p_legal}", headers=h)
        client.delete(f"/projects/{p_health}", headers=h)


@pytest.mark.e2e
def test_portfolio_forbidden_for_client(client, tokens):
    r = client.get(
        "/projects/portfolio",
        headers={"Authorization": f"Bearer {tokens['client_token']}"},
    )
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "forbidden"
