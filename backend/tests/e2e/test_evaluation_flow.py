import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal


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
    email = "e2e-eval@x.com"
    try:
        _purge_user(s, email)
        u = User(
            email=email, password_hash=hash_password("pwd12345678"), name="C", role="consultant"
        )
        s.add(u)
        s.commit()
        tok = client.post("/auth/login", json={"email": email, "password": "pwd12345678"}).json()[
            "access_token"
        ]
        yield tok
        _purge_user(s, email)
    finally:
        s.close()


_META_LLM = {
    "projeto_nome": "p",
    "documento_fonte": "d.docx",
    "data_extracao": "2026-05-21T00:00:00Z",
    "origem": "llm",
}
_META_GAB = {**_META_LLM, "origem": "gabarito_manual"}


@pytest.mark.e2e
def test_evaluation_404_when_only_one_source(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post("/projects", json={"name": "EV1", "domain": "legal"}, headers=h).json()["id"]
    try:
        # Only gabarito, no llm yet.
        client.post(
            f"/projects/{pid}/extractions/manual",
            json={"content": {"_meta": _META_GAB, "nome_projeto": "X"}},
            headers=h,
        )
        r = client.get(f"/projects/{pid}/extractions/evaluation", headers=h)
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "evaluation_not_available"
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_evaluation_with_llm_and_gabarito(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post("/projects", json={"name": "EV2", "domain": "legal"}, headers=h).json()["id"]
    try:
        # Gabarito ("ground truth")
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": _META_GAB,
                    "nome_projeto": "Projeto Certo",
                    "porte": "pequeno",
                    "custo_estimado": 800.0,
                    "data_inicio": "2026-01-01",
                }
            },
        )
        # LLM extraction (one TP, one FN, one FP, one TN scenario)
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={
                "content": {
                    "_meta": _META_LLM,
                    "nome_projeto": "Projeto Certo",  # TP (case-insensitive match)
                    "porte": "medio",  # FN (wrong value)
                    "tipo": "consultoria",  # FP (LLM invented; gabarito was null)
                    "data_inicio": None,  # FN (LLM missed)
                    "custo_estimado": 800.0,  # TP (exact number)
                }
            },
        )
        r = client.get(f"/projects/{pid}/extractions/evaluation", headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        m = body["estruturado_metrics"]
        # nome_projeto + custo_estimado → 2 TP
        # porte → 1 FN
        # data_inicio → 1 FN
        # tipo → 1 FP
        assert m["tp"] >= 2
        assert m["fn"] >= 2
        assert m["fp"] >= 1
        # F1 should be a valid float between 0 and 1
        assert 0.0 < m["f1"] <= 1.0
        # Per-attribute verdicts include the expected ones
        verdicts = {v["name"]: v["verdict"] for v in body["per_attribute"]}
        assert verdicts["nome_projeto"] == "tp"
        assert verdicts["porte"] == "fn"
        assert verdicts["tipo"] == "fp"
        # texto_livre attrs are deferred
        assert verdicts["objetivos"] == "needs_human_review"
        # fora_de_escopo
        assert verdicts["imagens_fotos"] == "out_of_scope"
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_evaluation_uses_most_recent_llm_when_multiple(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    pid = client.post("/projects", json={"name": "EV3", "domain": "legal"}, headers=h).json()["id"]
    try:
        # Gabarito
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={"content": {"_meta": _META_GAB, "nome_projeto": "Correto"}},
        )
        # Older llm with wrong value
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={"content": {"_meta": _META_LLM, "nome_projeto": "Errado"}},
        )
        # Newer llm with right value
        client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={"content": {"_meta": _META_LLM, "nome_projeto": "Correto"}},
        )
        r = client.get(f"/projects/{pid}/extractions/evaluation", headers=h)
        body = r.json()
        verdicts = {v["name"]: v["verdict"] for v in body["per_attribute"]}
        # The newest llm matches the gabarito → tp
        assert verdicts["nome_projeto"] == "tp"
    finally:
        client.delete(f"/projects/{pid}", headers=h)
