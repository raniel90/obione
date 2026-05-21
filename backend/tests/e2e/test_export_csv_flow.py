import csv
import io

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.comments.models import Comment
from obione.projects.models import Project
from obione.shared.database import SessionLocal

_VALID_META = {
    "projeto_nome": "p",
    "documento_fonte": "d.docx",
    "data_extracao": "2026-05-21T00:00:00Z",
    "origem": "gabarito_manual",
}


def _purge_users(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if not user_ids:
        return
    project_ids = [p.id for p in s.query(Project).filter(Project.consultant_id.in_(user_ids)).all()]
    if project_ids:
        s.query(Comment).filter(Comment.project_id.in_(project_ids)).delete(
            synchronize_session=False
        )
    s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(synchronize_session=False)
    s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    s.commit()


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    email = "e2e-export-csv@x.com"
    try:
        _purge_users(s, [email])
        u = User(
            email=email,
            password_hash=hash_password("pwd12345678"),
            name="C",
            role="consultant",
        )
        s.add(u)
        s.commit()
        tok = client.post("/auth/login", json={"email": email, "password": "pwd12345678"}).json()[
            "access_token"
        ]
        yield tok
        _purge_users(s, [email])
    finally:
        s.close()


@pytest.mark.e2e
def test_export_csv_returns_text_csv_with_attachment(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post("/projects", json={"name": "PCSV", "domain": "legal"}, headers=h).json()["id"]
    try:
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": _VALID_META,
                    "nome_projeto": "Projeto CSV",
                    "porte": "pequeno",
                    "nome_stakeholders": ["Alice", "Bruno"],
                }
            },
        )
        r = client.get(f"/projects/{pid}/export?format=csv", headers=h)
        assert r.status_code == 200, r.text
        assert r.headers["content-type"].startswith("text/csv")
        assert "attachment" in r.headers["content-disposition"]
        assert f"obione-export-{pid}.csv" in r.headers["content-disposition"]

        rows = list(csv.DictReader(io.StringIO(r.text)))
        assert len(rows) == 44
        nome = next(r for r in rows if r["attribute_name"] == "nome_projeto")
        assert nome["attribute_value"] == "Projeto CSV"
        stakeholders = next(r for r in rows if r["attribute_name"] == "nome_stakeholders")
        assert stakeholders["attribute_value"] == "Alice; Bruno"
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_export_default_format_remains_json(client, consultant_token):
    """No `format=` query → JSON bundle (backwards-compatible default)."""
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post("/projects", json={"name": "PCSV2", "domain": "legal"}, headers=h).json()[
        "id"
    ]
    try:
        r = client.get(f"/projects/{pid}/export", headers=h)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("application/json")
        assert r.json()["schema_version"] == "1.0"
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_export_csv_unknown_project_404(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    bogus = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/projects/{bogus}/export?format=csv", headers=h)
    assert r.status_code == 404
