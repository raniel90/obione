"""Pydantic DTOs for the cross-cliente cockpit (RF20)."""

from pydantic import BaseModel, Field


class StatusDistribution(BaseModel):
    """Counts of projects in each derived status. Aligns with the projects
    service `_derive_status` (registered → extracted → reviewed)."""

    registered: int = 0
    extracted: int = 0
    reviewed: int = 0


class ThemeBreakdown(BaseModel):
    """Aggregated indicators for a single domain/temática."""

    domain: str
    count: int
    avg_coverage: float = Field(description="Mean MPO coverage (0-100) of projects in the theme.")
    status_distribution: StatusDistribution
    reviewed_pct: float = Field(description="% of projects in the theme with gabarito_manual.")


class CockpitResponse(BaseModel):
    """RF20 — consultancy's view of the whole portfolio agrupado por temática."""

    total_projects: int
    avg_coverage_overall: float
    status_distribution: StatusDistribution
    themes: list[ThemeBreakdown]


class CoverageMatrixRow(BaseModel):
    """One project's coverage (0-100) per MPO category, for the heatmap."""

    project_id: str
    project_name: str
    domain: str
    coverages: dict[str, float] = Field(
        description="Map of category_key → coverage % (0-100). All 8 keys present."
    )


class CoverageMatrixResponse(BaseModel):
    """RF09 cross-portfólio — projects × MPO categories coverage matrix."""

    categories: list[str] = Field(description="Ordered 8 Quadro-37 category keys (columns).")
    rows: list[CoverageMatrixRow]
