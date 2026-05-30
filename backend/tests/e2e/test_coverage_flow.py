import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.settings import settings
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION


@pytest.fixture(autouse=True)
def _force_mock_provider(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")


def _purge_user(s, email: str) -> None:
    user_ids = [u.id for u in s.query(User).filter_by(email=email).all()]
    if user_ids:
        s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
            synchronize_session=False
        )
        s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        s.commit()


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    email = "e2e-cov@x.com"
    try:
        _purge_user(s, email)
        u = User(
            email=email,
            password_hash=hash_password("pwd12345678"),
            name="C",
            role="consultant",
        )
        s.add(u)
        s.commit()
        r = client.post("/auth/login", json={"email": email, "password": "pwd12345678"})
        yield r.json()["access_token"]
        _purge_user(s, email)
    finally:
        s.close()


@pytest.mark.e2e
def test_coverage_zero_when_no_extraction(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post(
        "/projects",
        json={"name": "PCov0", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    )
    pid = r.json()["id"]
    try:
        r = client.get(f"/projects/{pid}/extractions/coverage", headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["extraction_id"] is None
        assert body["filled"] == 0
        assert body["total_in_scope"] == 43
        assert body["out_of_scope_count"] == 1
        assert body["percentage"] == 0.0
        assert len(body["by_category"]) == 8
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_coverage_after_manual_extraction(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post(
        "/projects",
        json={"name": "PCov1", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    )
    pid = r.json()["id"]
    try:
        r = client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "p",
                        "documento_fonte": "d.docx",
                        "data_extracao": "2026-05-20T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "nome_projeto": "Manual Project",
                    "descricao": "narrative",
                    "porte": "pequeno",
                }
            },
        )
        assert r.status_code == 201, r.text
        extraction_id = r.json()["id"]

        r = client.get(f"/projects/{pid}/extractions/coverage", headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["extraction_id"] == extraction_id
        assert body["filled"] == 3
        assert body["total_in_scope"] == 43
        assert body["percentage"] == round(3 / 43 * 100, 2)
        conteudo_geral = next(c for c in body["by_category"] if c["category"] == "conteudo_geral")
        assert conteudo_geral["filled"] == 3
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_coverage_uses_latest_extraction(client, consultant_token):
    """When multiple extractions exist, the report reflects the most recent one."""
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post(
        "/projects",
        json={"name": "PCov2", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    )
    pid = r.json()["id"]
    try:
        # Older, smaller extraction
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "p",
                        "documento_fonte": "d.docx",
                        "data_extracao": "2026-05-20T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "nome_projeto": "v1",
                }
            },
        )
        # Newer, richer extraction
        r = client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "p",
                        "documento_fonte": "d.docx",
                        "data_extracao": "2026-05-20T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "nome_projeto": "v2",
                    "descricao": "desc",
                    "tipo": "consultoria",
                    "porte": "pequeno",
                    "nome_stakeholders": ["A", "B"],
                }
            },
        )
        newer_id = r.json()["id"]

        r = client.get(f"/projects/{pid}/extractions/coverage", headers=h)
        body = r.json()
        assert body["extraction_id"] == newer_id
        assert body["filled"] == 5
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_coverage_404_when_project_not_visible(client, consultant_token):
    """Cross-consultant isolation: project from another user returns 404 on coverage."""
    s = SessionLocal()
    other_email = "e2e-cov-other@x.com"
    try:
        _purge_user(s, other_email)
        other = User(
            email=other_email,
            password_hash=hash_password("pwd12345678"),
            name="Other",
            role="consultant",
        )
        s.add(other)
        s.commit()
        login = client.post("/auth/login", json={"email": other_email, "password": "pwd12345678"})
        other_tok = login.json()["access_token"]
        r = client.post(
            "/projects",
            json={"name": "PCovOther", "domain": "legal", "description": SAMPLE_DESCRIPTION},
            headers={"Authorization": f"Bearer {other_tok}"},
        )
        other_pid = r.json()["id"]
        try:
            r = client.get(
                f"/projects/{other_pid}/extractions/coverage",
                headers={"Authorization": f"Bearer {consultant_token}"},
            )
            assert r.status_code == 404
            assert r.json()["error"]["code"] == "project_not_found"
        finally:
            client.delete(
                f"/projects/{other_pid}",
                headers={"Authorization": f"Bearer {other_tok}"},
            )
        _purge_user(s, other_email)
    finally:
        s.close()
