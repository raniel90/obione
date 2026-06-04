"""Synthesis use cases — the "Conectora" (MPO "Combinar").

Generates one thematic synthesis per call from the lessons/risks of the
visible projects of a temática. Same draft → published lifecycle as Drafts;
published is immutable. Clients only ever read published syntheses (via the
per-project endpoint); generation/review is staff-only.

LGPD mitigation: the digests fed to the generator carry ONLY the
lessons/risks attribute values — never project/client names.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from obione.auth.models import User
from obione.extractions.coverage import all_attributes, category_of
from obione.projects.access_control import list_visible_projects
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.service import get_project_for_user
from obione.synthesis.exceptions import (
    SynthesisAlreadyPublishedError,
    SynthesisNoProjectsError,
    SynthesisNotFoundError,
)
from obione.synthesis.generator.port import AbstractSynthesisGenerator
from obione.synthesis.models import Synthesis
from obione.synthesis.schemas import SynthesisUpdate
from obione.unit_of_work import AbstractUnitOfWork

# The MPO categories the Conectora distils: lessons learned + risks.
_DIGEST_CATEGORIES = ("licoes_aprendidas", "riscos")
_DIGEST_KEYS = tuple(a for a in all_attributes() if category_of(a) in _DIGEST_CATEGORIES)

_EMPTY = (None, "", [], {})


def _require_consultor_or_admin(user: User) -> None:
    if user.role not in ("consultant", "admin"):
        raise ClientCannotMutateError(
            "Sínteses são curadas por consultores; clientes só leem as publicadas."
        )


def generate_synthesis(
    uow: AbstractUnitOfWork,
    generator: AbstractSynthesisGenerator,
    user: User,
    domain: str,
) -> Synthesis:
    _require_consultor_or_admin(user)
    with uow:
        projects = [p for p in list_visible_projects(uow, user) if p.domain == domain]
        if not projects:
            raise SynthesisNoProjectsError(
                f"Nenhum projeto visível na temática '{domain}'."
            )
        digests: list[dict] = []
        source_ids: list[str] = []
        for project in projects:
            extractions = uow.extractions.list_by_project(project.id)
            if not extractions:
                continue
            content = extractions[0].content or {}
            # Anonymised digest — lessons/risks attribute values only, no names.
            digest = {k: content.get(k) for k in _DIGEST_KEYS if content.get(k) not in _EMPTY}
            digests.append(digest)
            source_ids.append(str(project.id))
        if not digests:
            raise SynthesisNoProjectsError(
                f"Nenhum projeto da temática '{domain}' tem extração ainda."
            )
        generated = generator.synthesize(digests, domain=domain)
        synthesis = Synthesis(
            domain=domain,
            title=generated.title,
            body=generated.body,
            status="draft",
            source_project_ids=source_ids,
            llm_model=generated.model_id,
            generated_by=user.id,
        )
        uow.syntheses.add(synthesis)
        uow.commit()
        return synthesis


def list_syntheses_by_domain(
    uow: AbstractUnitOfWork, user: User, domain: str
) -> list[Synthesis]:
    """Staff-only: the full draft + published history for a temática."""
    _require_consultor_or_admin(user)
    with uow:
        return uow.syntheses.list_by_domain(domain)


def list_published_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Synthesis]:
    """Published syntheses of the project's temática — readable by anyone who
    can see the project (client included)."""
    project = get_project_for_user(uow, user, project_id)
    with uow:
        return uow.syntheses.list_by_domain(project.domain, only_published=True)


def _get_or_404(uow: AbstractUnitOfWork, synthesis_id: uuid.UUID) -> Synthesis:
    synthesis = uow.syntheses.get(synthesis_id)
    if synthesis is None:
        raise SynthesisNotFoundError(f"Synthesis not found: {synthesis_id}")
    return synthesis


def get_synthesis_for_user(
    uow: AbstractUnitOfWork, user: User, synthesis_id: uuid.UUID
) -> Synthesis:
    with uow:
        synthesis = _get_or_404(uow, synthesis_id)
        if user.role == "client" and synthesis.status != "published":
            raise SynthesisNotFoundError(f"Synthesis not found: {synthesis_id}")
        return synthesis


def update_synthesis(
    uow: AbstractUnitOfWork, user: User, synthesis_id: uuid.UUID, data: SynthesisUpdate
) -> Synthesis:
    _require_consultor_or_admin(user)
    with uow:
        synthesis = _get_or_404(uow, synthesis_id)
        if synthesis.status == "published":
            raise SynthesisAlreadyPublishedError("Sínteses publicadas são imutáveis.")
        if data.title is not None:
            synthesis.title = data.title
        if data.body is not None:
            synthesis.body = data.body
        synthesis.updated_at = datetime.now(tz=UTC)
        uow.commit()
        return synthesis


def delete_synthesis(uow: AbstractUnitOfWork, user: User, synthesis_id: uuid.UUID) -> None:
    _require_consultor_or_admin(user)
    with uow:
        synthesis = _get_or_404(uow, synthesis_id)
        if synthesis.status == "published":
            raise SynthesisAlreadyPublishedError("Sínteses publicadas não podem ser excluídas.")
        uow.syntheses.delete(synthesis)
        uow.commit()


def publish_synthesis(uow: AbstractUnitOfWork, user: User, synthesis_id: uuid.UUID) -> Synthesis:
    _require_consultor_or_admin(user)
    with uow:
        synthesis = _get_or_404(uow, synthesis_id)
        if synthesis.status == "published":
            raise SynthesisAlreadyPublishedError("Síntese já está publicada.")
        now = datetime.now(tz=UTC)
        synthesis.status = "published"
        synthesis.reviewed_by = user.id
        synthesis.reviewed_at = now
        synthesis.updated_at = now
        uow.commit()
        return synthesis
