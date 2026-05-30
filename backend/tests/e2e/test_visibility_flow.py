"""End-to-end CBAC scenarios:

1. Consultant configures visibility for a project.
2. Client sees only the released attributes; hidden keys are stripped
   from /extractions reads.
3. Coverage shown to the client uses the visible subset as denominator.
4. Client cannot configure visibility (403).
"""

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.extractions.coverage import all_attributes, all_categories, category_of
from obione.extractions.models import Extraction
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
def cbac_actors(client):
    """Seeds a consultant + a client, links them to a project that already
    has an LLM extraction with all 44 attributes filled. Yields tokens +
    project id."""
    s = SessionLocal()
    emails = ["e2e-vis-cons@x.com", "e2e-vis-cli@x.com"]
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

        cons_token = _login(emails[0])
        cli_token = _login(emails[1])
        cons_h = {"Authorization": f"Bearer {cons_token}"}

        pid = client.post(
            "/projects",
            headers=cons_h,
            json={
                "name": "ProjCBAC",
                "domain": "legal",
                "description": SAMPLE_DESCRIPTION,
            },
        ).json()["id"]
        client.post(
            f"/projects/{pid}/clients",
            headers=cons_h,
            json={"user_id": str(cli.id)},
        )
        # Seed an extraction with every attribute filled so we can clearly
        # see what CBAC strips. _meta survives no matter what.
        full_content = dict.fromkeys(all_attributes(), "valor")
        full_content["_meta"] = {"projeto_nome": "ProjCBAC", "origem": "llm"}
        s2 = SessionLocal()
        try:
            from uuid import UUID

            extr = Extraction(
                project_id=UUID(pid),
                source="llm",
                llm_model="mock",
                content=full_content,
                created_by=None,
            )
            s2.add(extr)
            s2.commit()
        finally:
            s2.close()

        yield {
            "cons_token": cons_token,
            "cli_token": cli_token,
            "project_id": pid,
            "cli_id": str(cli.id),
        }
        _purge_users(s, emails)
    finally:
        s.close()


@pytest.mark.e2e
def test_client_sees_nothing_by_default(client, cbac_actors):
    h = {"Authorization": f"Bearer {cbac_actors['cli_token']}"}
    r = client.get(f"/projects/{cbac_actors['project_id']}/extractions", headers=h)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    visible_keys = set(items[0]["content"].keys())
    # Only _meta should survive the filter when nothing is liberado.
    assert visible_keys == {"_meta"}


@pytest.mark.e2e
def test_client_sees_only_attributes_in_released_category(client, cbac_actors):
    cons_h = {"Authorization": f"Bearer {cbac_actors['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {cbac_actors['cli_token']}"}
    target_cat = "conteudo_geral"

    r = client.put(
        f"/projects/{cbac_actors['project_id']}/visibility/categories/{target_cat}",
        headers=cons_h,
        json={"visible": True},
    )
    assert r.status_code == 204

    r = client.get(f"/projects/{cbac_actors['project_id']}/extractions", headers=cli_h)
    assert r.status_code == 200
    content = r.json()[0]["content"]
    visible_attr_keys = [k for k in content if k != "_meta"]
    for k in visible_attr_keys:
        assert category_of(k) == target_cat


@pytest.mark.e2e
def test_attribute_override_hides_specific_attribute_inside_released_category(client, cbac_actors):
    cons_h = {"Authorization": f"Bearer {cbac_actors['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {cbac_actors['cli_token']}"}
    target_cat = "conteudo_geral"
    sample = next(a for a in all_attributes() if category_of(a) == target_cat)

    client.put(
        f"/projects/{cbac_actors['project_id']}/visibility/categories/{target_cat}",
        headers=cons_h,
        json={"visible": True},
    )
    client.put(
        f"/projects/{cbac_actors['project_id']}/visibility/attributes/{sample}",
        headers=cons_h,
        json={"visible": False},
    )
    content = client.get(
        f"/projects/{cbac_actors['project_id']}/extractions", headers=cli_h
    ).json()[0]["content"]
    assert sample not in content


@pytest.mark.e2e
def test_client_cannot_configure_visibility(client, cbac_actors):
    cli_h = {"Authorization": f"Bearer {cbac_actors['cli_token']}"}
    r = client.put(
        f"/projects/{cbac_actors['project_id']}/visibility/categories/{all_categories()[0]}",
        headers=cli_h,
        json={"visible": True},
    )
    assert r.status_code == 403


@pytest.mark.e2e
def test_client_coverage_uses_visible_subset_as_denominator(client, cbac_actors):
    cons_h = {"Authorization": f"Bearer {cbac_actors['cons_token']}"}
    cli_h = {"Authorization": f"Bearer {cbac_actors['cli_token']}"}

    # Liberate só 'conteudo_geral'.
    client.put(
        f"/projects/{cbac_actors['project_id']}/visibility/categories/conteudo_geral",
        headers=cons_h,
        json={"visible": True},
    )
    cli_cov = client.get(
        f"/projects/{cbac_actors['project_id']}/extractions/coverage",
        headers=cli_h,
    ).json()
    # All released attributes are filled in the seeded extraction → 100%.
    assert cli_cov["percentage"] == 100.0
    # Denominator é menor que o total in scope (44 - imagens_fotos = 43).
    assert cli_cov["total_in_scope"] < 43

    # Consultant sees the full denominator.
    cons_cov = client.get(
        f"/projects/{cbac_actors['project_id']}/extractions/coverage",
        headers=cons_h,
    ).json()
    assert cons_cov["total_in_scope"] == 43
