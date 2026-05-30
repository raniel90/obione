import pytest

from obione.auth.models import User
from obione.comments.schemas import CommentCreate
from obione.comments.service import create_comment
from obione.documents.models import Document
from obione.exports.service import export_project
from obione.extractions.models import Extraction
from obione.projects.exceptions import ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork
from tests._helpers import SAMPLE_DESCRIPTION


def _user(role: str = "consultant") -> User:
    return User(id=new_id(), email=f"{role}@x.com", password_hash="x", name="N", role=role)


@pytest.mark.unit
def test_export_includes_top_level_sections():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(
        uow,
        consultant,
        ProjectCreate(
            name="P",
            domain="legal",
            description=SAMPLE_DESCRIPTION,
        ),
    )
    bundle = export_project(uow, consultant, project.id)
    assert bundle["schema_version"] == "1.0"
    assert {
        "exported_at",
        "exported_by",
        "project",
        "documents",
        "extractions",
        "comments",
        "coverage",
    } <= set(bundle)


@pytest.mark.unit
def test_export_returns_empty_collections_for_bare_project():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    bundle = export_project(uow, consultant, project.id)
    assert bundle["documents"] == []
    assert bundle["extractions"] == []
    assert bundle["comments"] == []
    assert bundle["coverage"]["filled"] == 0


@pytest.mark.unit
def test_export_includes_all_child_entities():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )

    uow.documents.add(
        Document(
            project_id=project.id,
            original_name="d.docx",
            relative_path="docs/x.docx",
            sha256="a" * 64,
            size_bytes=100,
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploaded_by=consultant.id,
        )
    )
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={"_meta": {}, "nome_projeto": "X"},
            created_by=None,
        )
    )
    create_comment(uow, consultant, project.id, CommentCreate(body="hi"))

    bundle = export_project(uow, consultant, project.id)
    assert len(bundle["documents"]) == 1
    assert len(bundle["extractions"]) == 1
    assert len(bundle["comments"]) == 1
    assert bundle["extractions"][0]["source"] == "llm"
    assert bundle["comments"][0]["body"] == "hi"


@pytest.mark.unit
def test_export_includes_coverage_from_latest_extraction():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="manual",
            llm_model=None,
            content={
                "_meta": {},
                "nome_projeto": "X",
                "descricao": "y",
                "porte": "pequeno",
            },
            created_by=consultant.id,
        )
    )
    bundle = export_project(uow, consultant, project.id)
    cov = bundle["coverage"]
    assert cov["filled"] == 3
    assert cov["total_in_scope"] == 43
    by_cat = {c["category"]: c for c in cov["by_category"]}
    assert by_cat["conteudo_geral"]["filled"] == 3


@pytest.mark.unit
def test_export_jsonable_uuids_and_datetimes():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(
        uow, consultant, ProjectCreate(name="P", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    bundle = export_project(uow, consultant, project.id)
    # Project ID must be a string after _to_jsonable (so json.dumps works).
    import json

    json.dumps(bundle)  # raises if anything non-serializable leaks through


@pytest.mark.unit
def test_export_rejects_invisible_project():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant")
    cons_b = User(id=new_id(), email="b@x.com", password_hash="x", name="B", role="consultant")
    project_of_a = create_project(
        uow, cons_a, ProjectCreate(name="A", domain="legal", description=SAMPLE_DESCRIPTION)
    )
    with pytest.raises(ProjectNotFoundError):
        export_project(uow, cons_b, project_of_a.id)
