"""jsonschema validation of manual extractions against schema_extracao.json.

Used by US14 (importar gabarito manual) so anything tagged source=manual is
guaranteed to match the canonical academic schema before persistence.

The schema lives in the academic artifact `atividades/schema_extracao.json`
and is mounted at `/app/atividades/schema_extracao.json` inside the
container. The same lookup heuristic used by `extractions.coverage` applies.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from jsonschema import Draft202012Validator


def _candidate_paths() -> tuple[Path, ...]:
    candidates = [Path("/app/atividades/schema_extracao.json")]
    here = Path(__file__).resolve()
    if len(here.parents) > 4:
        candidates.append(here.parents[4] / "atividades" / "schema_extracao.json")
    return tuple(candidates)


@lru_cache(maxsize=1)
def _schema() -> dict:
    for p in _candidate_paths():
        if p.exists():
            return json.loads(p.read_text())
    raise FileNotFoundError(
        f"schema_extracao.json not found in any of: {_candidate_paths()}"
    )


@lru_cache(maxsize=1)
def _validator() -> Draft202012Validator:
    return Draft202012Validator(_schema())


def validate_manual_extraction(content: dict) -> list[str]:
    """Return a list of human-readable error messages (empty if valid)."""
    errors = sorted(_validator().iter_errors(content), key=lambda e: e.path)
    return [
        f"{'/'.join(str(p) for p in e.absolute_path) or '(root)'}: {e.message}"
        for e in errors
    ]
