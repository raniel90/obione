"""HTTP routes for the cross-cliente cockpit (RF20)."""

from fastapi import APIRouter

from obione.auth.dependencies import CurrentUser, get_uow
from obione.portfolio import service
from obione.portfolio.schemas import (
    CockpitResponse,
    CoverageMatrixResponse,
    CoverageMatrixRow,
    StatusDistribution,
    ThemeBreakdown,
)

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def _to_status_distribution(raw: dict) -> StatusDistribution:
    return StatusDistribution(**raw)


def _to_theme_breakdown(raw: dict) -> ThemeBreakdown:
    return ThemeBreakdown(
        domain=raw["domain"],
        count=raw["count"],
        avg_coverage=raw["avg_coverage"],
        status_distribution=_to_status_distribution(raw["status_distribution"]),
        reviewed_pct=raw["reviewed_pct"],
    )


@router.get("/cockpit", response_model=CockpitResponse)
def get_cockpit(user: CurrentUser) -> CockpitResponse:
    raw = service.cockpit(get_uow(), user)
    return CockpitResponse(
        total_projects=raw["total_projects"],
        avg_coverage_overall=raw["avg_coverage_overall"],
        status_distribution=_to_status_distribution(raw["status_distribution"]),
        themes=[_to_theme_breakdown(t) for t in raw["themes"]],
    )


@router.get("/cockpit/themes/{domain}", response_model=ThemeBreakdown)
def get_theme(domain: str, user: CurrentUser) -> ThemeBreakdown:
    raw = service.cockpit_by_theme(get_uow(), user, domain)
    return _to_theme_breakdown(raw)


@router.get("/coverage-matrix", response_model=CoverageMatrixResponse)
def get_coverage_matrix(user: CurrentUser) -> CoverageMatrixResponse:
    raw = service.coverage_matrix(get_uow(), user)
    return CoverageMatrixResponse(
        categories=raw["categories"],
        rows=[CoverageMatrixRow(**row) for row in raw["rows"]],
    )
