"""RF20 — read-model cockpit cross-cliente.

Pure aggregation over `projects` + `extractions`. No new tables, no
caching. Restricted to consultant + admin; clients get 403 (they don't
observe other clients).
"""

from __future__ import annotations

from collections import defaultdict
from statistics import mean

from obione.auth.models import User
from obione.extractions.coverage import compute_coverage
from obione.portfolio.exceptions import ThemeNotInPortfolioError
from obione.projects.access_control import list_visible_projects
from obione.projects.service import _derive_status, _is_gabarito
from obione.shared.exceptions import ForbiddenError
from obione.unit_of_work import AbstractUnitOfWork

_STATUSES = ("registered", "extracted", "reviewed")


def _require_consultant_or_admin(user: User) -> None:
    if user.role not in ("consultant", "admin"):
        raise ForbiddenError("Cockpit do portfólio é restrito a consultor/admin.")


def _empty_distribution() -> dict[str, int]:
    return dict.fromkeys(_STATUSES, 0)


def _project_row(uow, project):
    extractions = uow.extractions.list_by_project(project.id)
    has_gabarito = any(_is_gabarito(e) for e in extractions)
    if extractions:
        latest = extractions[0]
        coverage_pct = compute_coverage(latest.content).percentage
    else:
        coverage_pct = 0.0
    status = _derive_status(extraction_count=len(extractions), has_gabarito=has_gabarito)
    return {
        "project": project,
        "coverage": coverage_pct,
        "status": status,
        "has_gabarito": has_gabarito,
    }


def cockpit(uow: AbstractUnitOfWork, user: User) -> dict:
    """Return the full cross-cliente cockpit for the calling user.

    The user's role determines the project scope (consultant: own projects;
    admin: every project). Clients are blocked.
    """
    _require_consultant_or_admin(user)
    with uow:
        projects = list_visible_projects(uow, user)
        rows = [_project_row(uow, p) for p in projects]

    overall_status = _empty_distribution()
    for r in rows:
        overall_status[r["status"]] += 1

    by_domain: dict[str, list] = defaultdict(list)
    for r in rows:
        by_domain[r["project"].domain].append(r)

    themes = []
    for domain, items in by_domain.items():
        dist = _empty_distribution()
        for r in items:
            dist[r["status"]] += 1
        reviewed_pct = round(dist["reviewed"] / len(items) * 100, 2) if items else 0.0
        themes.append(
            {
                "domain": domain,
                "count": len(items),
                "avg_coverage": round(mean(r["coverage"] for r in items), 2) if items else 0.0,
                "status_distribution": dist,
                "reviewed_pct": reviewed_pct,
            }
        )
    themes.sort(key=lambda t: t["domain"])
    return {
        "total_projects": len(rows),
        "avg_coverage_overall": (round(mean(r["coverage"] for r in rows), 2) if rows else 0.0),
        "status_distribution": overall_status,
        "themes": themes,
    }


def cockpit_by_theme(uow: AbstractUnitOfWork, user: User, domain: str) -> dict:
    """Single-theme breakdown. 404 when the user has zero projects in `domain`."""
    full = cockpit(uow, user)
    for t in full["themes"]:
        if t["domain"] == domain:
            return t
    raise ThemeNotInPortfolioError(
        f"Temática '{domain}' não está presente no portfólio visível ao usuário."
    )
