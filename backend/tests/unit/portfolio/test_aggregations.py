"""Unit tests for the cross-cliente cockpit aggregations (RF20)."""

import pytest

from obione.auth.models import User
from obione.extractions.models import Extraction
from obione.portfolio.exceptions import ThemeNotInPortfolioError
from obione.portfolio.service import cockpit, cockpit_by_theme
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.exceptions import ForbiddenError
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork
from tests._helpers import SAMPLE_DESCRIPTION


def _user(role: str = "consultant", suffix: str = "x") -> User:
    return User(
        id=new_id(),
        email=f"{role}-{suffix}@x.com",
        password_hash="x",
        name="N",
        role=role,
    )


def _llm_extraction(project_id, **content_extras) -> Extraction:
    content = {"_meta": {"origem": "llm"}, "nome_projeto": "X", "porte": "pequeno"}
    content.update(content_extras)
    return Extraction(
        project_id=project_id,
        source="llm",
        llm_model="mock",
        content=content,
        created_by=None,
    )


def _gabarito_extraction(project_id) -> Extraction:
    return Extraction(
        project_id=project_id,
        source="manual",
        llm_model=None,
        content={
            "_meta": {"origem": "gabarito_manual"},
            "nome_projeto": "Y",
            "descricao": "z",
        },
        created_by=None,
    )


@pytest.mark.unit
def test_empty_portfolio_returns_zero_indicators():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    raw = cockpit(uow, cons)
    assert raw["total_projects"] == 0
    assert raw["avg_coverage_overall"] == 0.0
    assert raw["themes"] == []


@pytest.mark.unit
def test_cockpit_groups_projects_by_domain():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    create_project(
        uow, cons, ProjectCreate(name="L1", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    create_project(
        uow, cons, ProjectCreate(name="L2", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    create_project(
        uow, cons, ProjectCreate(name="H1", domain="health", description=SAMPLE_DESCRIPTION)
    )
    raw = cockpit(uow, cons)
    assert raw["total_projects"] == 3
    by_domain = {t["domain"]: t for t in raw["themes"]}
    assert by_domain["legal"]["count"] == 2
    assert by_domain["health"]["count"] == 1


@pytest.mark.unit
def test_cockpit_reflects_status_distribution():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    create_project(
        uow, cons, ProjectCreate(name="Reg", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    p_ext = create_project(
        uow, cons, ProjectCreate(name="Ext", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    p_rev = create_project(
        uow, cons, ProjectCreate(name="Rev", domain="health", description=SAMPLE_DESCRIPTION)
    )
    uow.extractions.add(_llm_extraction(p_ext.id))
    uow.extractions.add(_gabarito_extraction(p_rev.id))

    raw = cockpit(uow, cons)
    dist = raw["status_distribution"]
    assert dist == {"registered": 1, "extracted": 1, "reviewed": 1}
    by_domain = {t["domain"]: t for t in raw["themes"]}
    assert by_domain["legal"]["status_distribution"] == {
        "registered": 1,
        "extracted": 1,
        "reviewed": 0,
    }
    assert by_domain["health"]["reviewed_pct"] == 100.0
    # Avoid the "all-zero" project skewing avg_coverage to 0 only.
    assert by_domain["legal"]["avg_coverage"] > 0  # Ext has some content filled
    # `p_reg` has no extraction → contributes 0 coverage to the average.


@pytest.mark.unit
def test_client_forbidden_to_view_cockpit():
    uow = FakeUnitOfWork()
    cli = _user("client")
    with pytest.raises(ForbiddenError):
        cockpit(uow, cli)


@pytest.mark.unit
def test_cockpit_by_theme_returns_only_matching_domain():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    create_project(
        uow, cons, ProjectCreate(name="L1", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    create_project(
        uow, cons, ProjectCreate(name="H1", domain="health", description=SAMPLE_DESCRIPTION)
    )
    legal = cockpit_by_theme(uow, cons, "legal")
    assert legal["domain"] == "legal"
    assert legal["count"] == 1


@pytest.mark.unit
def test_cockpit_by_theme_404_when_theme_absent():
    uow = FakeUnitOfWork()
    cons = _user("consultant")
    create_project(
        uow, cons, ProjectCreate(name="L1", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    with pytest.raises(ThemeNotInPortfolioError):
        cockpit_by_theme(uow, cons, "sports")


@pytest.mark.unit
def test_consultant_only_aggregates_own_projects():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    create_project(
        uow, cons_a, ProjectCreate(name="A1", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    create_project(
        uow, cons_b, ProjectCreate(name="B1", domain="health", description=SAMPLE_DESCRIPTION)
    )
    raw = cockpit(uow, cons_a)
    assert raw["total_projects"] == 1
    assert raw["themes"][0]["domain"] == "legal"


@pytest.mark.unit
def test_admin_sees_every_project_across_consultants():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    admin = _user("admin")
    create_project(
        uow, cons_a, ProjectCreate(name="A1", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    create_project(
        uow, cons_b, ProjectCreate(name="B1", domain="health", description=SAMPLE_DESCRIPTION)
    )
    raw = cockpit(uow, admin)
    assert raw["total_projects"] == 2
