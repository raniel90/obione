import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.likert.models import LikertResponse
from obione.projects.models import Project
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION


def _purge_users(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if not user_ids:
        return
    s.query(LikertResponse).filter(LikertResponse.respondent_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    project_ids = [p.id for p in s.query(Project).filter(Project.consultant_id.in_(user_ids)).all()]
    if project_ids:
        s.query(LikertResponse).filter(LikertResponse.project_id.in_(project_ids)).delete(
            synchronize_session=False
        )
        s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
            synchronize_session=False
        )
    s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    s.commit()


@pytest.fixture
def trio(client):
    """A consultant + admin + assigned-client triple, with one shared project.

    Wipes the entire likert_responses table at the start: the consultoria
    flavor has no project_id, so it doesn't cascade when projects/users
    leave the DB, and any past curl smoke that hit /likert/consultoria
    keeps polluting the summary count. Test ownership of the table is
    safe here — only e2e suites write to it.
    """
    s = SessionLocal()
    emails = ["e2e-lik-cons@x.com", "e2e-lik-admin@x.com", "e2e-lik-cli@x.com"]
    try:
        s.query(LikertResponse).delete()
        s.commit()
        _purge_users(s, emails)
        cons = User(
            email=emails[0],
            password_hash=hash_password("pwd12345678"),
            name="Cons",
            role="consultant",
        )
        admin = User(
            email=emails[1],
            password_hash=hash_password("pwd12345678"),
            name="Admin",
            role="admin",
        )
        cli = User(
            email=emails[2],
            password_hash=hash_password("pwd12345678"),
            name="Cli",
            role="client",
        )
        s.add_all([cons, admin, cli])
        s.commit()
        s.refresh(cons)
        s.refresh(admin)
        s.refresh(cli)

        def _login(email: str) -> str:
            return client.post(
                "/auth/login", json={"email": email, "password": "pwd12345678"}
            ).json()["access_token"]

        result = {
            "cons_id": str(cons.id),
            "admin_id": str(admin.id),
            "cli_id": str(cli.id),
            "cons_token": _login(emails[0]),
            "admin_token": _login(emails[1]),
            "cli_token": _login(emails[2]),
        }
        yield result
        _purge_users(s, emails)
    finally:
        s.close()


_GOOD_CONS = {
    "utilidade_drafts": 5,
    "reducao_friccao": 4,
    "qualidade_resumo": 5,
    "manutenibilidade_mediador": 4,
}


@pytest.mark.e2e
def test_consultant_submits_then_summary_aggregates(client, trio):
    h = {"Authorization": f"Bearer {trio['cons_token']}"}
    r = client.post("/likert/consultoria", json=_GOOD_CONS, headers=h)
    assert r.status_code == 201, r.text
    assert len(r.json()) == 4

    r = client.get("/likert/summary?kind=consultoria", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["kind"] == "consultoria"
    assert body["respondent_count"] == 1
    dims = {d["dimension"]: d for d in body["by_dimension"]}
    assert dims["utilidade_drafts"]["mean"] == 5.0
    assert dims["reducao_friccao"]["mean"] == 4.0


@pytest.mark.e2e
def test_client_submits_for_assigned_project(client, trio):
    cons_h = {"Authorization": f"Bearer {trio['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {trio['cli_token']}"}

    pid = client.post(
        "/projects",
        json={"name": "PLik", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=cons_h,
    ).json()["id"]
    try:
        client.post(f"/projects/{pid}/clients", json={"user_id": trio["cli_id"]}, headers=cons_h)
        r = client.post(
            "/likert/client",
            json={
                "project_id": pid,
                "clareza_resumo": 5,
                "utilidade_espaco": 4,
                "qualidade_dialogo": 5,
                "sentido_inclusao": 5,
            },
            headers=cli_h,
        )
        assert r.status_code == 201, r.text
        assert len(r.json()) == 4
        assert all(row["project_id"] == pid for row in r.json())
    finally:
        client.delete(f"/projects/{pid}", headers=cons_h)


@pytest.mark.e2e
def test_client_blocked_from_project_not_assigned(client, trio):
    cons_h = {"Authorization": f"Bearer {trio['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {trio['cli_token']}"}

    pid = client.post(
        "/projects",
        json={"name": "PHidden", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=cons_h,
    ).json()["id"]
    try:
        # Client not added — submission should 404 on the project lookup.
        r = client.post(
            "/likert/client",
            json={
                "project_id": pid,
                "clareza_resumo": 5,
                "utilidade_espaco": 4,
                "qualidade_dialogo": 5,
                "sentido_inclusao": 5,
            },
            headers=cli_h,
        )
        assert r.status_code == 404
    finally:
        client.delete(f"/projects/{pid}", headers=cons_h)


@pytest.mark.e2e
def test_consultoria_rejected_for_client_role(client, trio):
    h = {"Authorization": f"Bearer {trio['cli_token']}"}
    r = client.post("/likert/consultoria", json=_GOOD_CONS, headers=h)
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "wrong_likert_role"


@pytest.mark.e2e
def test_client_blocked_for_consultant_role(client, trio):
    """Consultants can't submit client-side feedback (only admins can multi-cast)."""
    cons_h = {"Authorization": f"Bearer {trio['cons_token']}"}
    pid = client.post(
        "/projects",
        json={"name": "PCR", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=cons_h,
    ).json()["id"]
    try:
        r = client.post(
            "/likert/client",
            json={
                "project_id": pid,
                "clareza_resumo": 5,
                "utilidade_espaco": 4,
                "qualidade_dialogo": 5,
                "sentido_inclusao": 5,
            },
            headers=cons_h,
        )
        assert r.status_code == 403
    finally:
        client.delete(f"/projects/{pid}", headers=cons_h)


@pytest.mark.e2e
def test_responses_listing_restricted_to_consultor_admin(client, trio):
    """Clients can't read the raw response stream."""
    h = {"Authorization": f"Bearer {trio['cli_token']}"}
    r = client.get("/likert/responses?kind=consultoria", headers=h)
    assert r.status_code == 403


@pytest.mark.e2e
def test_score_out_of_range_422(client, trio):
    h = {"Authorization": f"Bearer {trio['cons_token']}"}
    payload = {**_GOOD_CONS, "utilidade_drafts": 6}
    r = client.post("/likert/consultoria", json=payload, headers=h)
    assert r.status_code == 422  # Pydantic validation


@pytest.mark.e2e
def test_summary_for_empty_kind_returns_zero(client, trio):
    h = {"Authorization": f"Bearer {trio['cons_token']}"}
    r = client.get("/likert/summary?kind=client", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["respondent_count"] == 0
    assert all(d["count"] == 0 for d in body["by_dimension"])
