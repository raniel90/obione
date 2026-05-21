"""MPO extraction evaluation (US15).

Compares an LLM-produced extraction against a human-curated gabarito and
emits a per-attribute verdict + aggregated precision/recall/F1 over the
*estruturado* attributes (TP/FP/FN counted). *Texto_livre* attributes are
flagged ``needs_human_review`` — the academic protocol applies a 0/0.5/1
rubric by two evaluators on those (Sprint 5, US15 manual step) and the
backend has no business pretending to score them automatically.

Normalization for estruturado matchers:
  - strings: strip + casefold + collapse internal whitespace
  - arrays of strings: order-independent set comparison after normalization
  - numbers: exact float equality
  - dates / enums: exact string equality after strip
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from obione.extractions.coverage import attribute_specs


@dataclass(frozen=True)
class AttributeVerdict:
    name: str
    category: str
    extraction_type: str
    llm_value: object
    gabarito_value: object
    verdict: str  # "tp" | "fp" | "fn" | "tn" | "needs_human_review" | "out_of_scope"


@dataclass(frozen=True)
class GroupMetrics:
    """Precision / Recall / F1 over one group of attributes."""

    group: str  # "estruturado" | "texto_livre" | "aggregate"
    tp: int
    fp: int
    fn: int
    tn: int

    @property
    def total(self) -> int:
        return self.tp + self.fp + self.fn + self.tn

    @property
    def precision(self) -> float:
        denom = self.tp + self.fp
        return round(self.tp / denom, 4) if denom else 0.0

    @property
    def recall(self) -> float:
        denom = self.tp + self.fn
        return round(self.tp / denom, 4) if denom else 0.0

    @property
    def f1(self) -> float:
        p, r = self.precision, self.recall
        if (p + r) == 0:
            return 0.0
        return round(2 * p * r / (p + r), 4)


@dataclass(frozen=True)
class EvaluationReport:
    per_attribute: tuple[AttributeVerdict, ...]
    estruturado_metrics: GroupMetrics
    needs_human_review_count: int
    out_of_scope_count: int


_WHITESPACE_RE = re.compile(r"\s+")


def _normalize_string(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip().casefold()
    text = _WHITESPACE_RE.sub(" ", text)
    return text or None


def _normalize_array(value: object) -> frozenset[str] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        return None
    items = {_normalize_string(x) for x in value if x is not None}
    items.discard(None)
    return frozenset(items) if items else None


def _is_present(value: object) -> bool:
    """A value is 'present' (worth scoring) when it's not null/empty."""
    if value is None:
        return False
    if isinstance(value, str) and not value.strip():
        return False
    if isinstance(value, (list, dict)) and not value:
        return False
    return True


def _structured_match(spec, llm_value, gabarito_value) -> bool:
    if spec.value_type == "array":
        return _normalize_array(llm_value) == _normalize_array(gabarito_value)
    if spec.value_type == "number":
        return llm_value == gabarito_value  # exact float equality
    # string / date / enum
    return _normalize_string(llm_value) == _normalize_string(gabarito_value)


def _verdict_for_attribute(spec, llm_value, gabarito_value) -> str:
    if spec.out_of_scope or spec.extraction_type == "fora_de_escopo":
        return "out_of_scope"
    if spec.extraction_type == "texto_livre":
        return "needs_human_review"
    # estruturado branch — confusion matrix elements
    llm_present = _is_present(llm_value)
    gab_present = _is_present(gabarito_value)
    if not llm_present and not gab_present:
        return "tn"
    if llm_present and not gab_present:
        return "fp"  # fabricated
    if not llm_present and gab_present:
        return "fn"  # missed
    return "tp" if _structured_match(spec, llm_value, gabarito_value) else "fn"


def compare_extractions(
    llm_content: dict, gabarito_content: dict
) -> EvaluationReport:
    """Score `llm_content` against `gabarito_content` for all 44 attributes."""
    per_attribute: list[AttributeVerdict] = []
    tp = fp = fn = tn = 0
    needs_review = 0
    oos = 0
    for spec in attribute_specs():
        llm_val = llm_content.get(spec.name)
        gab_val = gabarito_content.get(spec.name)
        verdict = _verdict_for_attribute(spec, llm_val, gab_val)
        per_attribute.append(AttributeVerdict(
            name=spec.name,
            category=spec.category,
            extraction_type=spec.extraction_type,
            llm_value=llm_val,
            gabarito_value=gab_val,
            verdict=verdict,
        ))
        if verdict == "tp":
            tp += 1
        elif verdict == "fp":
            fp += 1
        elif verdict == "fn":
            fn += 1
        elif verdict == "tn":
            tn += 1
        elif verdict == "needs_human_review":
            needs_review += 1
        elif verdict == "out_of_scope":
            oos += 1
    return EvaluationReport(
        per_attribute=tuple(per_attribute),
        estruturado_metrics=GroupMetrics(
            group="estruturado", tp=tp, fp=fp, fn=fn, tn=tn,
        ),
        needs_human_review_count=needs_review,
        out_of_scope_count=oos,
    )
