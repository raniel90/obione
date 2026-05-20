"""Extraction use cases."""
import uuid

from obione.auth.models import User
from obione.extractions.llm.port import AbstractExtractor
from obione.extractions.models import Extraction
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def list_extractions_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Extraction]:
    get_project_for_user(uow, user, project_id)
    with uow:
        return uow.extractions.list_by_project(project_id)


def create_extraction_from_pipeline(
    uow: AbstractUnitOfWork,
    extractor: AbstractExtractor,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    document_bytes: bytes,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    result = extractor.extract(document_bytes)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=document_id,
            source="llm",
            llm_model=result.model_id,
            content=result.content,
            created_by=None,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction


def create_extraction_from_manual(
    uow: AbstractUnitOfWork,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    content: dict,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=document_id,
            source="manual",
            llm_model=None,
            content=content,
            created_by=user.id,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction
