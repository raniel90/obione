"""End-to-end coverage of US14 — manual extractions must validate against
atividades/schema_extracao.json before they are persisted."""

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal
from tests._helpers import SAMPLE_DESCRIPTION

_VALID_META = {
    "projeto_nome": "p",
    "documento_fonte": "d.docx",
    "data_extracao": "2026-05-21T00:00:00Z",
    "origem": "gabarito_manual",
}


def _purge_users(s, emails: list[str]) -> None:
    user_ids = [u.id for u in s.query(User).filter(User.email.in_(emails)).all()]
    if user_ids:
        s.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
            synchronize_session=False
        )
        s.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        s.commit()


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    email = "e2e-gabarito@x.com"
    try:
        _purge_users(s, [email])
        u = User(
            email=email, password_hash=hash_password("pwd12345678"), name="C", role="consultant"
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
def test_valid_gabarito_accepted(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post(
        "/projects",
        json={"name": "GV", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        r = client.post(
            f"/projects/{pid}/extractions/manual",
            json={
                "content": {
                    "_meta": _VALID_META,
                    "nome_projeto": "X",
                    "porte": "pequeno",
                }
            },
            headers=h,
        )
        assert r.status_code == 201, r.text
        assert r.json()["source"] == "manual"
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_invalid_gabarito_rejected_with_details(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post(
        "/projects",
        json={"name": "GI", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        r = client.post(
            f"/projects/{pid}/extractions/manual",
            json={
                "content": {
                    "_meta": {
                        "projeto_nome": "p",
                        # documento_fonte missing → schema violation
                        "data_extracao": "2026-05-21T00:00:00Z",
                        "origem": "gabarito_manual",
                    },
                    "porte": "GIGANTE",  # not in enum
                }
            },
            headers=h,
        )
        assert r.status_code == 400, r.text
        body = r.json()["error"]
        assert body["code"] == "schema_validation_error"
        assert isinstance(body["details"], list)
        assert len(body["details"]) >= 2
        joined = " ".join(body["details"])
        assert "documento_fonte" in joined
        assert "porte" in joined
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_gabarito_rejects_invented_attribute(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post(
        "/projects",
        json={"name": "GJ", "domain": "legal", "description": SAMPLE_DESCRIPTION},
        headers=h,
    ).json()["id"]
    try:
        r = client.post(
            f"/projects/{pid}/extractions/manual",
            json={
                "content": {
                    "_meta": _VALID_META,
                    "atributo_que_nao_existe": "x",
                }
            },
            headers=h,
        )
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "schema_validation_error"
    finally:
        client.delete(f"/projects/{pid}", headers=h)
