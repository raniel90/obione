from datetime import UTC, datetime, timedelta

import pytest

from obione.auth.models import User
from obione.comments.schemas import CommentCreate
from obione.comments.service import create_comment
from obione.documents.models import Document
from obione.extractions.models import Extraction
from obione.feed.service import build_feed_for_user
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
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


def _now_offset(seconds: int) -> datetime:
    return datetime.now(tz=UTC) + timedelta(seconds=seconds)


@pytest.mark.unit
def test_consultant_sees_events_from_own_projects_only():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    p_a = create_project(uow, cons_a, ProjectCreate(name="A", domain="legal"))
    p_b = create_project(uow, cons_b, ProjectCreate(name="B", domain="health"))

    c_a = create_comment(uow, cons_a, p_a.id, CommentCreate(body="em A"))
    c_b = create_comment(uow, cons_b, p_b.id, CommentCreate(body="em B"))

    events_a = build_feed_for_user(uow, cons_a)
    target_ids = {e.target_id for e in events_a}
    assert c_a.id in target_ids
    assert c_b.id not in target_ids


@pytest.mark.unit
def test_client_sees_only_assigned_projects():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    client = _user("client")
    p_visible = create_project(uow, consultant, ProjectCreate(name="V", domain="legal"))
    p_hidden = create_project(uow, consultant, ProjectCreate(name="H", domain="health"))

    add_client_to_project(uow, consultant, p_visible.id, client.id)

    create_comment(uow, consultant, p_visible.id, CommentCreate(body="vis"))
    create_comment(uow, consultant, p_hidden.id, CommentCreate(body="esc"))

    events = build_feed_for_user(uow, client)
    project_ids = {e.project_id for e in events}
    assert project_ids == {p_visible.id}


@pytest.mark.unit
def test_admin_sees_all_projects():
    uow = FakeUnitOfWork()
    cons_a = _user("consultant", "a")
    cons_b = _user("consultant", "b")
    admin = _user("admin")
    p_a = create_project(uow, cons_a, ProjectCreate(name="A", domain="legal"))
    p_b = create_project(uow, cons_b, ProjectCreate(name="B", domain="health"))
    create_comment(uow, cons_a, p_a.id, CommentCreate(body="A"))
    create_comment(uow, cons_b, p_b.id, CommentCreate(body="B"))

    events = build_feed_for_user(uow, admin)
    project_ids = {e.project_id for e in events}
    assert project_ids == {p_a.id, p_b.id}


@pytest.mark.unit
def test_events_sorted_by_created_at_desc():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))

    # Force three events with predictable timestamps.
    c1 = create_comment(uow, consultant, project.id, CommentCreate(body="oldest"))
    c1.created_at = _now_offset(-300)
    c2 = create_comment(uow, consultant, project.id, CommentCreate(body="mid"))
    c2.created_at = _now_offset(-150)
    c3 = create_comment(uow, consultant, project.id, CommentCreate(body="newest"))
    c3.created_at = _now_offset(0)

    events = build_feed_for_user(uow, consultant)
    assert [e.target_id for e in events] == [c3.id, c2.id, c1.id]


@pytest.mark.unit
def test_feed_merges_comments_extractions_documents():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))

    create_comment(uow, consultant, project.id, CommentCreate(body="comment body"))
    extraction = Extraction(
        project_id=project.id,
        document_id=None,
        source="llm",
        llm_model="mock",
        content={"_meta": {}},
        created_by=None,
        created_at=_now_offset(-10),
    )
    uow.extractions.add(extraction)
    doc = Document(
        project_id=project.id,
        original_name="x.docx",
        relative_path="x.docx",
        sha256="0" * 64,
        size_bytes=1,
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploaded_by=consultant.id,
        uploaded_at=_now_offset(-5),
    )
    uow.documents.add(doc)

    events = build_feed_for_user(uow, consultant)
    kinds = {e.kind for e in events}
    assert kinds == {"new_comment", "new_extraction", "new_document"}


@pytest.mark.unit
def test_feed_summary_for_extractions_uses_model_id():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    uow.extractions.add(
        Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model="ollama/llama3.1:8b",
            content={"_meta": {}},
            created_by=None,
            created_at=_now_offset(0),
        )
    )
    events = build_feed_for_user(uow, consultant)
    extraction_events = [e for e in events if e.kind == "new_extraction"]
    assert "ollama/llama3.1:8b" in extraction_events[0].summary


@pytest.mark.unit
def test_feed_truncates_long_comments_to_140_chars():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    long_body = "x" * 500
    create_comment(uow, consultant, project.id, CommentCreate(body=long_body))
    events = build_feed_for_user(uow, consultant)
    assert len(events[0].summary) <= 140
    assert events[0].summary.endswith("…")


@pytest.mark.unit
def test_feed_empty_when_user_has_no_visible_projects():
    uow = FakeUnitOfWork()
    client = _user("client")
    assert build_feed_for_user(uow, client) == []


@pytest.mark.unit
def test_feed_respects_limit():
    uow = FakeUnitOfWork()
    consultant = _user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    for i in range(20):
        c = create_comment(uow, consultant, project.id, CommentCreate(body=f"c{i}"))
        c.created_at = _now_offset(-i)

    events = build_feed_for_user(uow, consultant, limit=5)
    assert len(events) == 5
