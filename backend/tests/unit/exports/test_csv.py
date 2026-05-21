import csv
import io

import pytest

from obione.auth.models import User
from obione.exports.service import export_project_attributes_csv
from obione.extractions.models import Extraction
from obione.projects.exceptions import ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


def _user(role: str = "consultant", suffix: str = "x") -> User:
    return User(
        id=new_id(),
        email=f"{role}-{suffix}@x.com",
        password_hash="x",
        name="N",
        role=role,
    )


def _parse(text: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(text)))


@pytest.mark.unit
def test_csv_has_header_and_44_rows_per_extraction():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={
                "_meta": {
                    "projeto_nome": "p",
                    "documento_fonte": "d.docx",
                    "data_extracao": "2026-05-21T00:00:00Z",
                    "origem": "llm",
                },
                "nome_projeto": "X",
                "porte": "pequeno",
            },
            created_by=None,
        )
    )
    body = export_project_attributes_csv(uow, consultant, project.id)
    rows = _parse(body)
    assert len(rows) == 44
    assert {r["attribute_name"] for r in rows} >= {"nome_projeto", "porte", "imagens_fotos"}


@pytest.mark.unit
def test_csv_columns_match_contract():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={"_meta": {"origem": "llm"}, "nome_projeto": "X"},
            created_by=None,
        )
    )
    body = export_project_attributes_csv(uow, consultant, project.id)
    rows = _parse(body)
    row = rows[0]
    assert set(row.keys()) == {
        "project_id",
        "project_name",
        "extraction_id",
        "extraction_source",
        "extraction_llm_model",
        "extraction_created_at",
        "attribute_name",
        "attribute_category",
        "attribute_type",
        "attribute_out_of_scope",
        "attribute_value",
    }
    assert row["project_name"] == "P"


@pytest.mark.unit
def test_csv_renders_arrays_with_semicolon_separator():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={
                "_meta": {"origem": "llm"},
                "nome_stakeholders": ["Bruno", "Cynthia"],
            },
            created_by=None,
        )
    )
    rows = _parse(export_project_attributes_csv(uow, consultant, project.id))
    stake = next(r for r in rows if r["attribute_name"] == "nome_stakeholders")
    assert stake["attribute_value"] == "Bruno; Cynthia"


@pytest.mark.unit
def test_csv_null_becomes_empty_cell():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={"_meta": {"origem": "llm"}, "nome_projeto": None},
            created_by=None,
        )
    )
    rows = _parse(export_project_attributes_csv(uow, consultant, project.id))
    nome = next(r for r in rows if r["attribute_name"] == "nome_projeto")
    assert nome["attribute_value"] == ""


@pytest.mark.unit
def test_csv_marks_imagens_fotos_as_out_of_scope():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="mock",
            content={"_meta": {"origem": "llm"}},
            created_by=None,
        )
    )
    rows = _parse(export_project_attributes_csv(uow, consultant, project.id))
    imagens = next(r for r in rows if r["attribute_name"] == "imagens_fotos")
    assert imagens["attribute_out_of_scope"] == "true"
    # And every other attribute should be in-scope.
    others = [r for r in rows if r["attribute_name"] != "imagens_fotos"]
    assert all(r["attribute_out_of_scope"] == "false" for r in others)


@pytest.mark.unit
def test_csv_includes_one_block_per_extraction():
    """Two extractions → 88 rows total (44 attrs × 2)."""
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    for i in range(2):
        uow.extractions.add(
            Extraction(
                project_id=project.id,
                document_id=None,
                source="llm" if i == 0 else "manual",
                llm_model="mock" if i == 0 else None,
                content={"_meta": {"origem": "llm" if i == 0 else "gabarito_manual"}},
                created_by=None,
            )
        )
    rows = _parse(export_project_attributes_csv(uow, consultant, project.id))
    assert len(rows) == 88
    sources = {r["extraction_source"] for r in rows}
    assert sources == {"llm", "manual"}


@pytest.mark.unit
def test_csv_empty_when_project_has_no_extractions():
    uow = FakeUnitOfWork()
    consultant = _user()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    body = export_project_attributes_csv(uow, consultant, project.id)
    rows = _parse(body)
    assert rows == []  # only the header line


@pytest.mark.unit
def test_csv_rejects_invisible_project():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    project_of_a = create_project(uow, cons_a, ProjectCreate(name="A", domain="legal"))
    with pytest.raises(ProjectNotFoundError):
        export_project_attributes_csv(uow, cons_b, project_of_a.id)
