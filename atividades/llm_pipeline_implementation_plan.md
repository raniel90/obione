# LLM Pipeline Implementation Plan (Sprint 2 — T2.1 / US05)

> **For agentic workers:** Execute task-by-task using `superpowers:executing-plans`. Each step has a checkbox; TDD applies wherever a test file is named.

**Goal:** Wire a real LLM extractor into the chassis port (`AbstractExtractor`) so the system can extract the 44 attributes of the MPO Quadro 37 from a `.docx` document and persist them via the existing `Extraction` model. Mock mode keeps working for tests and offline dev.

**Architecture references:**
- Pipeline spec: `atividades/arquitetura_pipeline.md`
- Backend chassis spec: `atividades/arquitetura_backend.md`
- Target schema: `atividades/schema_extracao.json` (44 attributes + `_meta`)
- Example output: `atividades/schema_extracao_exemplo.json`
- Existing port: `backend/src/obione/extractions/llm/port.py` (`AbstractExtractor`, `ExtractionResult`)
- Existing mock: `backend/src/obione/extractions/llm/mock.py` (`MockExtractor`)
- US05 acceptance: `atividades/backlog_obione.md` (lines 93-103)

**Provider selection (single env var):**
- `LLM_PROVIDER=mock` → `MockExtractor` (current behavior, default for dev/tests/CI)
- `LLM_PROVIDER=ollama/llama3.1:8b` → `InstructorExtractor` with Ollama backend
- `LLM_PROVIDER=anthropic/claude-sonnet-4-6` → `InstructorExtractor` with Anthropic (needs `LLM_API_KEY`)

**Branch:** continue on `feat/backend-chassis-phase-0`. Open PR for `main` only once US05 is end-to-end functional with at least one real provider.

---

## File map

All paths relative to repo root.

| Path | Status | Responsibility |
|---|---|---|
| `backend/pyproject.toml` | modify | add `instructor>=1.6`, `python-docx>=1.1`, `jsonschema>=4.23` |
| `backend/src/obione/extractions/llm/schema.py` | new | Pydantic `ProjetoExtraido` mirroring `schema_extracao.json` |
| `backend/src/obione/extractions/llm/loader.py` | new | `extract_text_from_docx(content: bytes) -> str` |
| `backend/src/obione/extractions/llm/prompts.py` | new | `build_extraction_messages(doc_text, project_name, document_name)` |
| `backend/src/obione/extractions/llm/instructor_adapter.py` | new | `InstructorExtractor` implementing `AbstractExtractor` |
| `backend/src/obione/extractions/llm/factory.py` | new | `get_extractor(settings) -> AbstractExtractor` |
| `backend/src/obione/extractions/llm/mock.py` | modify | load `schema_extracao_exemplo.json` from `/atividades/` mount |
| `backend/src/obione/extractions/llm/port.py` | unchanged | port signature stays compatible |
| `backend/src/obione/extractions/service.py` | modify | add `create_extraction_from_document(uow, extractor, user, project_id, document_id)` |
| `backend/src/obione/extractions/router.py` | modify | add `POST /projects/{id}/extractions/from-document/{doc_id}` |
| `backend/src/obione/extractions/dependencies.py` | new | `get_extractor()` FastAPI dep wrapping factory |
| `backend/src/obione/documents/storage/port.py` | unchanged | already supports `read(rel_path) -> bytes` |
| `backend/src/obione/settings.py` | modify | tighten `LLM_PROVIDER` typing; document mock/ollama/anthropic prefixes |
| `backend/docker-compose.yml` | modify | mount `../atividades:/app/atividades:ro` so Mock + tests find the example JSON |
| `backend/tests/unit/extractions/test_schema.py` | new | round-trips, defaults, _meta required |
| `backend/tests/unit/extractions/test_loader.py` | new | docx→text with python-docx fixture (real .docx bytes) |
| `backend/tests/unit/extractions/test_factory.py` | new | provider routing |
| `backend/tests/unit/extractions/test_service_from_document.py` | new | uses FakeExtractor + Fake storage |
| `backend/tests/e2e/test_extractions_from_document.py` | new | full POST with mock provider against real storage + Postgres |

---

## Phase A — Schema, deps, mock refresh

### Task A.1: Add deps + rebuild image

- [ ] **Step 1:** edit `backend/pyproject.toml`, add to `dependencies`:
```
"instructor>=1.6",
"python-docx>=1.1",
"jsonschema>=4.23",
```
- [ ] **Step 2:** rebuild container so deps are baked: `cd backend && make down && make up`
- [ ] **Step 3:** smoke import inside container:
  `docker-compose exec -T backend python -c "import instructor, docx, jsonschema; print('OK')"`
- [ ] **Step 4:** commit `chore(deps): add instructor + python-docx + jsonschema for LLM pipeline`

### Task A.2: Mount atividades/ in the backend container

- [ ] **Step 1:** edit `backend/docker-compose.yml`, under `backend.volumes`, add: `- ../atividades:/app/atividades:ro`
- [ ] **Step 2:** `make down && make up`; verify: `docker-compose exec -T backend ls /app/atividades/schema_extracao.json`
- [ ] **Step 3:** commit `chore(compose): mount atividades read-only so Mock + tests reach the schema`

### Task A.3: Pydantic ProjetoExtraido mirror

**Files:** `backend/src/obione/extractions/llm/schema.py`, `backend/tests/unit/extractions/test_schema.py`

- [ ] **Step 1:** Write failing test (`test_schema.py`):
```python
import pytest
from obione.extractions.llm.schema import ProjetoExtraido, MetaExtracao

@pytest.mark.unit
def test_schema_all_fields_default_to_none():
    p = ProjetoExtraido(_meta=MetaExtracao(
        projeto_nome="x", documento_fonte="x.docx",
        data_extracao="2026-05-20T00:00:00Z", origem="llm",
    ))
    assert p.nome_projeto is None
    assert p.porte is None
    # spot-check one field per category
    assert p.objetivos_principais is None
    assert p.partes_interessadas is None

@pytest.mark.unit
def test_schema_roundtrips_example_file():
    import json
    from pathlib import Path
    data = json.loads(Path("/app/atividades/schema_extracao_exemplo.json").read_text())
    p = ProjetoExtraido.model_validate(data)
    assert p._meta.projeto_nome
```
- [ ] **Step 2:** Implement `schema.py` — one Pydantic model per the 44 fields in `schema_extracao.json`. All fields `Optional[...] = None` except `_meta`. Use `Field(description=...)` everywhere — Instructor passes the description to the LLM.
- [ ] **Step 3:** Run: `pytest tests/unit/extractions/test_schema.py -v` — expect 2 passed.
- [ ] **Step 4:** commit `feat(extractions): add ProjetoExtraido Pydantic mirror of schema_extracao.json`

### Task A.4: Update MockExtractor to load the example file from /app/atividades

**Files:** `backend/src/obione/extractions/llm/mock.py`

- [ ] **Step 1:** Adjust default `example_path` to `/app/atividades/schema_extracao_exemplo.json`; keep fallback dict for outside-container runs.
- [ ] **Step 2:** Add test in `tests/unit/extractions/test_llm_mock.py`:
```python
@pytest.mark.unit
def test_mock_extractor_loads_example_from_container_mount():
    e = MockExtractor()
    r = e.extract(b"x")
    assert "_meta" in r.content
    # If the mount worked, content has the 44 keys; if it didn't, FALLBACK kicked in.
    # We only assert structure, not field-count, so both code paths pass:
    assert isinstance(r.content.get("_meta"), dict)
```
- [ ] **Step 3:** Run all unit tests. Commit `feat(extractions): mock extractor loads schema_extracao_exemplo from /app/atividades`

---

## Phase B — Loader

### Task B.1: docx → text

**Files:** `backend/src/obione/extractions/llm/loader.py`, `backend/tests/unit/extractions/test_loader.py`

- [ ] **Step 1:** Failing test using a real `.docx` from `/app/atividades/../contexto/projetos/` (mount that too if needed). Simpler: create a tiny `.docx` inline using python-docx for the test:
```python
import io
import pytest
from docx import Document

from obione.extractions.llm.loader import extract_text_from_docx

def _make_docx_bytes(paragraphs: list[str]) -> bytes:
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()

@pytest.mark.unit
def test_extract_text_concatenates_paragraphs():
    raw = _make_docx_bytes(["Linha 1", "Linha 2", "", "Linha 3"])
    text = extract_text_from_docx(raw)
    assert "Linha 1" in text
    assert "Linha 2" in text
    assert "Linha 3" in text

@pytest.mark.unit
def test_extract_text_includes_table_cells():
    doc = Document()
    table = doc.add_table(rows=2, cols=2)
    table.rows[0].cells[0].text = "Cabecalho"
    table.rows[1].cells[0].text = "Valor"
    buf = io.BytesIO(); doc.save(buf)
    text = extract_text_from_docx(buf.getvalue())
    assert "Cabecalho" in text
    assert "Valor" in text
```
- [ ] **Step 2:** Implement `loader.py`:
```python
import io
from docx import Document

def extract_text_from_docx(content: bytes) -> str:
    doc = Document(io.BytesIO(content))
    parts: list[str] = []
    for p in doc.paragraphs:
        if p.text.strip():
            parts.append(p.text)
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text for c in row.cells if c.text.strip()]
            if cells:
                parts.append(" | ".join(cells))
    return "\n".join(parts)
```
- [ ] **Step 3:** Run tests + commit `feat(extractions): add docx loader (paragraphs + flattened tables)`

---

## Phase C — Prompts + Instructor adapter

### Task C.1: Prompt builder

**Files:** `backend/src/obione/extractions/llm/prompts.py`

(No unit test — pure templating, covered by adapter tests.)

- [ ] **Step 1:** Implement:
```python
"""Prompt construction for the MPO extraction call.

Keep messages short and in PT-BR — the LLM follows tipo-de-extracao hints in
ProjetoExtraido field descriptions.
"""

def build_extraction_messages(
    *, doc_text: str, project_name: str, document_name: str
) -> list[dict]:
    system = (
        "Você é um analista do MPO (Modelo de Observatório de Projetos, Vieira 2022). "
        "Sua tarefa é extrair os 44 atributos do Quadro 37 de um documento .docx "
        "real de consultoria. Use as descrições dos campos como guia. "
        "Quando o documento NÃO mencionar o atributo, retorne null — nunca invente. "
        "Mantenha o texto na língua original (PT-BR)."
    )
    user = (
        f"Projeto: {project_name}\n"
        f"Documento: {document_name}\n\n"
        f"===CONTEUDO===\n{doc_text}\n===FIM==="
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
```
- [ ] **Step 2:** commit `feat(extractions): add PT-BR extraction prompt builder`

### Task C.2: InstructorExtractor adapter

**Files:** `backend/src/obione/extractions/llm/instructor_adapter.py`

(Live LLM test deferred to manual smoke — unit test mocks the instructor client.)

- [ ] **Step 1:** Implement:
```python
"""Instructor-based extractor. One adapter, many providers via from_provider()."""
from __future__ import annotations

from datetime import datetime, timezone

import instructor

from obione.extractions.llm.loader import extract_text_from_docx
from obione.extractions.llm.port import ExtractionResult
from obione.extractions.llm.prompts import build_extraction_messages
from obione.extractions.llm.schema import MetaExtracao, ProjetoExtraido


class InstructorExtractor:
    """Implements AbstractExtractor.

    `provider` is the string accepted by instructor.from_provider, e.g.
      "ollama/llama3.1:8b"
      "anthropic/claude-sonnet-4-6"
      "openai/gpt-5-mini"
    For Ollama we force JSON mode; other providers use the library default.
    """

    def __init__(self, provider: str, *, project_name: str = "unknown",
                 document_name: str = "document.docx"):
        self._provider = provider
        self._project_name = project_name
        self._document_name = document_name
        mode = instructor.Mode.JSON if provider.startswith("ollama/") else None
        kwargs = {"mode": mode} if mode is not None else {}
        self._client = instructor.from_provider(provider, **kwargs)

    def extract(self, document_bytes: bytes) -> ExtractionResult:
        doc_text = extract_text_from_docx(document_bytes)
        messages = build_extraction_messages(
            doc_text=doc_text,
            project_name=self._project_name,
            document_name=self._document_name,
        )
        projeto: ProjetoExtraido = self._client.create(
            response_model=ProjetoExtraido,
            messages=messages,
            max_retries=3,
        )
        # Stamp _meta with runtime info (LLM may have filled placeholders).
        projeto._meta = MetaExtracao(
            projeto_nome=self._project_name,
            documento_fonte=self._document_name,
            data_extracao=datetime.now(tz=timezone.utc).isoformat(),
            origem="llm",
            modelo_llm=self._provider,
        )
        return ExtractionResult(
            content=projeto.model_dump(mode="json"),
            model_id=self._provider,
        )
```
- [ ] **Step 2:** commit `feat(extractions): add InstructorExtractor adapter (multi-provider via from_provider)`

### Task C.3: Factory + settings + dependency

**Files:**
- `backend/src/obione/extractions/llm/factory.py`
- `backend/src/obione/extractions/dependencies.py`
- `backend/src/obione/settings.py` (tighten doc)
- `backend/tests/unit/extractions/test_factory.py`

- [ ] **Step 1:** Failing test:
```python
import pytest

from obione.extractions.llm.factory import build_extractor
from obione.extractions.llm.instructor_adapter import InstructorExtractor
from obione.extractions.llm.mock import MockExtractor


@pytest.mark.unit
def test_factory_returns_mock_for_mock_provider():
    ex = build_extractor(provider="mock", project_name="p", document_name="d")
    assert isinstance(ex, MockExtractor)


@pytest.mark.unit
def test_factory_returns_instructor_for_real_provider(monkeypatch):
    # Don't actually init Ollama — patch from_provider so it doesn't network.
    import instructor as _i

    class _FakeClient:
        pass

    monkeypatch.setattr(_i, "from_provider", lambda *a, **kw: _FakeClient())
    ex = build_extractor(provider="ollama/llama3.1:8b", project_name="p", document_name="d")
    assert isinstance(ex, InstructorExtractor)
```
- [ ] **Step 2:** Implement `factory.py`:
```python
"""Pick the right AbstractExtractor implementation from settings."""
from obione.extractions.llm.instructor_adapter import InstructorExtractor
from obione.extractions.llm.mock import MockExtractor
from obione.extractions.llm.port import AbstractExtractor


def build_extractor(
    *, provider: str, project_name: str, document_name: str
) -> AbstractExtractor:
    if provider == "mock":
        return MockExtractor()
    return InstructorExtractor(
        provider=provider,
        project_name=project_name,
        document_name=document_name,
    )
```
- [ ] **Step 3:** Add `dependencies.py`:
```python
"""FastAPI deps for the extractions context."""
from obione.extractions.llm.factory import build_extractor
from obione.extractions.llm.port import AbstractExtractor
from obione.settings import settings


def get_extractor_for(project_name: str, document_name: str) -> AbstractExtractor:
    return build_extractor(
        provider=settings.LLM_PROVIDER,
        project_name=project_name,
        document_name=document_name,
    )
```
- [ ] **Step 4:** Tighten settings.py docstring on `LLM_PROVIDER` (no code change, just intent):
```
# LLM_PROVIDER: "mock" | "ollama/<model>" | "anthropic/<model>" | "openai/<model>"
# Anything not "mock" routes to InstructorExtractor via instructor.from_provider.
```
- [ ] **Step 5:** Run tests + commit `feat(extractions): add extractor factory + FastAPI dep`

---

## Phase D — Pipeline service + endpoint

### Task D.1: Service — `create_extraction_from_document`

**Files:** `backend/src/obione/extractions/service.py`, `backend/tests/unit/extractions/test_service_from_document.py`

- [ ] **Step 1:** Failing test using a FakeExtractor (returns canned dict) + FakeBlobStorage (in-memory):
```python
import pytest

from obione.auth.models import User
from obione.documents.models import Document
from obione.documents.storage.filesystem import FakeBlobStorage
from obione.extractions.llm.port import ExtractionResult
from obione.extractions.service import create_extraction_from_document
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


class _CannedExtractor:
    def extract(self, b: bytes) -> ExtractionResult:
        return ExtractionResult(content={"_meta": {"projeto_nome": "p"}}, model_id="canned")


def _consultant() -> User:
    return User(id=new_id(), email="c@x.com", password_hash="x", name="C", role="consultant")


@pytest.mark.unit
def test_create_from_document_reads_storage_and_persists():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))

    # Seed a document referencing a blob that exists in storage.
    sha, rel = storage.write(project.id, b"docx-bytes")
    doc = Document(
        project_id=project.id, original_name="d.docx", relative_path=rel,
        sha256=sha, size_bytes=10, mime_type="application/vnd...wordprocessingml.document",
        uploaded_by=consultant.id,
    )
    uow.documents.add(doc)

    extraction = create_extraction_from_document(
        uow, storage, _CannedExtractor(), consultant,
        project_id=project.id, document_id=doc.id,
    )
    assert extraction.source == "llm"
    assert extraction.llm_model == "canned"
    assert extraction.document_id == doc.id
    assert extraction.content["_meta"]["projeto_nome"] == "p"
```
- [ ] **Step 2:** Implement in `service.py`:
```python
def create_extraction_from_document(
    uow: AbstractUnitOfWork,
    storage,  # AbstractBlobStorage
    extractor: AbstractExtractor,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    with uow:
        document = uow.documents.get(document_id)
        if document is None or document.project_id != project.id:
            from obione.extractions.exceptions import ExtractionNotFoundError
            raise ExtractionNotFoundError(f"Document not in this project: {document_id}")
        # Service is allowed to read storage outside the transaction —
        # the file is immutable (content-addressable) so no race.
        content_bytes = storage.read(document.relative_path)
        result = extractor.extract(content_bytes)
        extraction = Extraction(
            project_id=project.id,
            document_id=document.id,
            source="llm",
            llm_model=result.model_id,
            content=result.content,
            created_by=None,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction
```
- [ ] **Step 3:** Run + commit `feat(extractions): add create_extraction_from_document service`

### Task D.2: Endpoint

**Files:** `backend/src/obione/extractions/router.py`, `backend/tests/e2e/test_extractions_from_document.py`

- [ ] **Step 1:** Add endpoint in `router.py`:
```python
from fastapi import Depends
from obione.documents.dependencies import get_blob_storage
from obione.documents.storage.port import AbstractBlobStorage
from obione.extractions.dependencies import get_extractor_for
from obione.unit_of_work import SqlAlchemyUnitOfWork

@router.post("/from-document/{document_id}", response_model=ExtractionResponse, status_code=201)
def create_from_document(
    project_id: uuid.UUID, document_id: uuid.UUID, user: CurrentUser,
    storage: AbstractBlobStorage = Depends(get_blob_storage),
) -> ExtractionResponse:
    # Look up doc metadata first so the extractor gets meaningful names.
    with SqlAlchemyUnitOfWork() as uow:
        doc = uow.documents.get(document_id)
        if doc is None:
            from obione.extractions.exceptions import ExtractionNotFoundError
            raise ExtractionNotFoundError(f"Document not found: {document_id}")
        project = uow.projects.get(doc.project_id)
        project_name = project.name if project else "unknown"
        document_name = doc.original_name
    extractor = get_extractor_for(project_name, document_name)
    e = service.create_extraction_from_document(
        get_uow(), storage, extractor, user,
        project_id=project_id, document_id=document_id,
    )
    return ExtractionResponse.model_validate(e)
```
- [ ] **Step 2:** Failing e2e test (mock provider, real Postgres + filesystem storage):
```python
import io
import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.projects.models import Project
from obione.shared.database import SessionLocal

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _purge_user(s, email):
    ids = [u.id for u in s.query(User).filter_by(email=email).all()]
    if ids:
        s.query(Project).filter(Project.consultant_id.in_(ids)).delete(synchronize_session=False)
        s.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
        s.commit()


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    email = "e2e-pipe@x.com"
    try:
        _purge_user(s, email)
        u = User(email=email, password_hash=hash_password("pwd12345678"),
                 name="C", role="consultant")
        s.add(u); s.commit()
        r = client.post("/auth/login",
                        json={"email": email, "password": "pwd12345678"})
        yield r.json()["access_token"]
        _purge_user(s, email)
    finally:
        s.close()


@pytest.mark.e2e
def test_extract_from_uploaded_document(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post("/projects", json={"name": "PPipe", "domain": "legal"}, headers=h)
    pid = r.json()["id"]
    try:
        # Make a minimal valid .docx
        from docx import Document
        d = Document(); d.add_paragraph("Conteudo do projeto Valença.")
        buf = io.BytesIO(); d.save(buf)
        files = {"file": ("v.docx", io.BytesIO(buf.getvalue()), DOCX_MIME)}
        r = client.post(f"/projects/{pid}/documents", headers=h, files=files)
        doc_id = r.json()["id"]

        # Trigger extraction (LLM_PROVIDER=mock by default)
        r = client.post(f"/projects/{pid}/extractions/from-document/{doc_id}", headers=h)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["source"] == "llm"
        assert body["llm_model"] == "mock"
        assert "_meta" in body["content"]

        # And it shows up in the list
        r = client.get(f"/projects/{pid}/extractions", headers=h)
        assert any(x["source"] == "llm" for x in r.json())
    finally:
        client.delete(f"/projects/{pid}", headers=h)
```
- [ ] **Step 3:** Run e2e + commit `feat(extractions): add POST /projects/{id}/extractions/from-document/{doc_id}`

---

## Phase E — Manual Ollama smoke (deferred)

**Goal:** confirm the real pipeline runs against Llama 3.1 8B once Ollama is available. Not part of automated CI.

- [ ] **Step 1 (manual, when user is ready):** `ollama pull llama3.1:8b && ollama serve &`
- [ ] **Step 2:** edit `backend/.env`: `LLM_PROVIDER=ollama/llama3.1:8b` and add `LLM_BASE_URL=http://host.docker.internal:11434` if needed
- [ ] **Step 3:** `make down && make up`
- [ ] **Step 4:** upload one of the Valença .docx files via API; trigger from-document extraction; inspect JSON for plausible coverage of the 44 attributes.
- [ ] **Step 5:** if it works, write a short note in `atividades/` (`pipeline_smoke_ollama.md`) capturing latency, coverage %, and any bug discovered. Commit.

This phase is NOT prerequisite for PR review — code shipping with mock-only is acceptable; the smoke verifies the slot.

---

## Done criteria

- All unit + integration + e2e green via `make test` (mock provider)
- `make up` boots; `POST /projects/{id}/extractions/from-document/{doc_id}` returns 201 with content matching `schema_extracao.json` shape
- README or a short note documents how to switch `LLM_PROVIDER` to a real backend
- Manual Ollama smoke (Phase E) optional but recommended before opening the PR for `main`
