"""MPO coverage calculator.

Reads the canonical schema_extracao.json once at import time and exposes a
mapping of every attribute to its MPO category + fora-de-escopo flag. Coverage
of an extraction is then the ratio of non-null in-scope attributes over total
in-scope attributes (`imagens_fotos` is the only fora-de-escopo today).

Aligns with US09 from the backlog (Indicador de cobertura do MPO).
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

def _candidate_paths() -> tuple[Path, ...]:
    """Schema lookup order: container mount first, then repo-relative fallback.

    The fallback only applies when the file lives deep enough on the filesystem
    (i.e. outside the container at `<repo>/backend/src/obione/extractions/`).
    """
    candidates = [Path("/app/atividades/schema_extracao.json")]
    here = Path(__file__).resolve()
    if len(here.parents) > 5:
        candidates.append(here.parents[5] / "atividades" / "schema_extracao.json")
    return tuple(candidates)


_SCHEMA_CANDIDATES = _candidate_paths()


@dataclass(frozen=True)
class AttributeSpec:
    name: str
    category: str
    out_of_scope: bool


@lru_cache(maxsize=1)
def _load_schema() -> dict:
    for path in _SCHEMA_CANDIDATES:
        if path.exists():
            return json.loads(path.read_text())
    raise FileNotFoundError(
        f"schema_extracao.json not found in any of: {_SCHEMA_CANDIDATES}"
    )


@lru_cache(maxsize=1)
def attribute_specs() -> tuple[AttributeSpec, ...]:
    """Return the immutable ordered tuple of (name, category, out_of_scope).

    The order follows the JSON schema (44 attributes, _meta excluded).
    """
    schema = _load_schema()
    specs: list[AttributeSpec] = []
    for name, props in schema["properties"].items():
        if name == "_meta":
            continue
        specs.append(
            AttributeSpec(
                name=name,
                category=props.get("x-categoria", "uncategorized"),
                out_of_scope=bool(props.get("x-fora-de-escopo", False)),
            )
        )
    return tuple(specs)


@dataclass(frozen=True)
class CategoryCoverage:
    category: str
    filled: int
    total_in_scope: int

    @property
    def percentage(self) -> float:
        if self.total_in_scope == 0:
            return 0.0
        return round(self.filled / self.total_in_scope * 100, 2)


@dataclass(frozen=True)
class CoverageReport:
    extraction_id: str | None
    filled: int
    total_in_scope: int
    out_of_scope_count: int
    by_category: tuple[CategoryCoverage, ...]

    @property
    def percentage(self) -> float:
        if self.total_in_scope == 0:
            return 0.0
        return round(self.filled / self.total_in_scope * 100, 2)


def compute_coverage(
    content: dict, *, extraction_id: str | None = None
) -> CoverageReport:
    """Compute per-category + aggregate coverage from an extraction `content` dict.

    `content` is the JSONB-shaped dict persisted in `Extraction.content` —
    contains the 44 attribute keys at the top level (plus `_meta`).
    """
    specs = attribute_specs()

    per_category_filled: dict[str, int] = {}
    per_category_total: dict[str, int] = {}
    aggregate_filled = 0
    aggregate_total = 0
    out_of_scope_count = 0

    for spec in specs:
        if spec.out_of_scope:
            out_of_scope_count += 1
            continue
        per_category_total[spec.category] = per_category_total.get(spec.category, 0) + 1
        aggregate_total += 1
        value = content.get(spec.name)
        if value not in (None, "", [], {}):
            per_category_filled[spec.category] = (
                per_category_filled.get(spec.category, 0) + 1
            )
            aggregate_filled += 1

    by_category = tuple(
        CategoryCoverage(
            category=cat,
            filled=per_category_filled.get(cat, 0),
            total_in_scope=per_category_total[cat],
        )
        # Preserve the schema's natural category ordering.
        for cat in dict.fromkeys(s.category for s in specs if not s.out_of_scope)
    )
    return CoverageReport(
        extraction_id=extraction_id,
        filled=aggregate_filled,
        total_in_scope=aggregate_total,
        out_of_scope_count=out_of_scope_count,
        by_category=by_category,
    )
