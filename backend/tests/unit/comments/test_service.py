import pytest

from obione.auth.models import User
from obione.comments.exceptions import (
    CannotReplyToReplyError,
    CommentNotFoundError,
    NotCommentAuthorError,
)
from obione.comments.schemas import CommentCreate, CommentUpdate
from obione.comments.service import (
    create_comment,
    delete_comment,
    list_comments_for_project,
    update_comment,
)
from obione.projects.exceptions import ProjectNotFoundError
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


def _make_user(role: str = "consultant", email_suffix: str = "x") -> User:
    return User(
        id=new_id(), email=f"{role}-{email_suffix}@x.com",
        password_hash="x", name="N", role=role,
    )


@pytest.mark.unit
def test_consultant_posts_and_lists_comment():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    c = create_comment(
        uow, consultant, project.id, CommentCreate(body="primeira observação")
    )
    assert c.project_id == project.id
    assert c.author_id == consultant.id
    assert c.parent_id is None
    listed = list_comments_for_project(uow, consultant, project.id)
    assert [x.id for x in listed] == [c.id]


@pytest.mark.unit
def test_client_assigned_can_comment():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    add_client_to_project(uow, consultant, project.id, client.id)

    c = create_comment(uow, client, project.id, CommentCreate(body="dúvida do cliente"))
    assert c.author_id == client.id


@pytest.mark.unit
def test_client_not_assigned_cannot_see_or_post():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    other_client = _make_user("client", "other")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    with pytest.raises(ProjectNotFoundError):
        list_comments_for_project(uow, other_client, project.id)
    with pytest.raises(ProjectNotFoundError):
        create_comment(uow, other_client, project.id, CommentCreate(body="x"))


@pytest.mark.unit
def test_reply_to_top_level_works():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    parent = create_comment(uow, consultant, project.id, CommentCreate(body="pai"))
    reply = create_comment(
        uow, consultant, project.id,
        CommentCreate(body="resposta", parent_id=parent.id),
    )
    assert reply.parent_id == parent.id


@pytest.mark.unit
def test_reply_to_reply_rejected():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    parent = create_comment(uow, consultant, project.id, CommentCreate(body="pai"))
    reply = create_comment(
        uow, consultant, project.id,
        CommentCreate(body="resposta", parent_id=parent.id),
    )
    with pytest.raises(CannotReplyToReplyError):
        create_comment(
            uow, consultant, project.id,
            CommentCreate(body="reply de reply", parent_id=reply.id),
        )


@pytest.mark.unit
def test_reply_to_comment_in_other_project_rejected():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    p1 = create_project(uow, consultant, ProjectCreate(name="P1", domain="legal"))
    p2 = create_project(uow, consultant, ProjectCreate(name="P2", domain="health"))
    c1 = create_comment(uow, consultant, p1.id, CommentCreate(body="em P1"))
    with pytest.raises(CommentNotFoundError):
        create_comment(
            uow, consultant, p2.id,
            CommentCreate(body="tentativa cross-project", parent_id=c1.id),
        )


@pytest.mark.unit
def test_author_can_edit_own_comment():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    c = create_comment(uow, consultant, project.id, CommentCreate(body="v1"))
    edited = update_comment(uow, consultant, c.id, CommentUpdate(body="v2"))
    assert edited.body == "v2"


@pytest.mark.unit
def test_non_author_cannot_edit_someone_elses_comment():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    add_client_to_project(uow, consultant, project.id, client.id)
    c = create_comment(uow, client, project.id, CommentCreate(body="do cliente"))
    with pytest.raises(NotCommentAuthorError):
        update_comment(uow, consultant, c.id, CommentUpdate(body="hack"))


@pytest.mark.unit
def test_author_deletes_own_comment():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    c = create_comment(uow, consultant, project.id, CommentCreate(body="x"))
    delete_comment(uow, consultant, c.id)
    assert list_comments_for_project(uow, consultant, project.id) == []


@pytest.mark.unit
def test_project_consultant_can_moderate_client_comment():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    add_client_to_project(uow, consultant, project.id, client.id)
    c = create_comment(uow, client, project.id, CommentCreate(body="ofensivo"))
    delete_comment(uow, consultant, c.id)
    assert list_comments_for_project(uow, consultant, project.id) == []


@pytest.mark.unit
def test_client_cannot_delete_consultant_comment():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    add_client_to_project(uow, consultant, project.id, client.id)
    c = create_comment(uow, consultant, project.id, CommentCreate(body="do consultor"))
    with pytest.raises(NotCommentAuthorError):
        delete_comment(uow, client, c.id)


@pytest.mark.unit
def test_admin_can_moderate():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    admin = _make_user("admin")
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    c = create_comment(uow, consultant, project.id, CommentCreate(body="x"))
    delete_comment(uow, admin, c.id)
    assert list_comments_for_project(uow, consultant, project.id) == []
