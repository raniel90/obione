import pytest

from obione.auth.models import User
from obione.projects.exceptions import (
    ClientCannotMutateError,
    ProjectNotFoundError,
)
from obione.projects.schemas import ProjectCreate, ProjectUpdate
from obione.projects.service import (
    add_client_to_project,
    create_project,
    delete_project,
    get_project_for_user,
    list_projects_for_user,
    update_project,
)
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


def _make_user(role: str = "consultant") -> User:
    return User(id=new_id(), email=f"{role}@x.com", password_hash="x", name="N", role=role)


@pytest.mark.unit
def test_admin_sees_all_projects():
    uow = FakeUnitOfWork()
    admin = _make_user("admin")
    c1 = _make_user("consultant")
    create_project(uow, c1, ProjectCreate(name="A", domain="legal"))
    create_project(uow, c1, ProjectCreate(name="B", domain="health"))
    assert len(list_projects_for_user(uow, admin)) == 2


@pytest.mark.unit
def test_consultant_sees_only_own():
    uow = FakeUnitOfWork()
    c1 = _make_user("consultant")
    c2 = _make_user("consultant")
    create_project(uow, c1, ProjectCreate(name="A", domain="legal"))
    create_project(uow, c2, ProjectCreate(name="B", domain="health"))
    assert len(list_projects_for_user(uow, c1)) == 1


@pytest.mark.unit
def test_client_sees_only_assigned():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    p = create_project(uow, consultant, ProjectCreate(name="X", domain="legal"))
    assert list_projects_for_user(uow, client) == []
    add_client_to_project(uow, consultant, p.id, client.id)
    assert len(list_projects_for_user(uow, client)) == 1


@pytest.mark.unit
def test_get_not_found_when_not_visible():
    uow = FakeUnitOfWork()
    c1 = _make_user("consultant")
    c2 = _make_user("consultant")
    p = create_project(uow, c1, ProjectCreate(name="X", domain="legal"))
    with pytest.raises(ProjectNotFoundError):
        get_project_for_user(uow, c2, p.id)


@pytest.mark.unit
def test_client_cannot_create():
    uow = FakeUnitOfWork()
    client = _make_user("client")
    with pytest.raises(ClientCannotMutateError):
        create_project(uow, client, ProjectCreate(name="X", domain="legal"))


@pytest.mark.unit
def test_client_cannot_update_or_delete():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    p = create_project(uow, consultant, ProjectCreate(name="X", domain="legal"))
    add_client_to_project(uow, consultant, p.id, client.id)
    with pytest.raises(ClientCannotMutateError):
        update_project(uow, client, p.id, ProjectUpdate(name="Y"))
    with pytest.raises(ClientCannotMutateError):
        delete_project(uow, client, p.id)


@pytest.mark.unit
def test_consultant_cannot_update_others_project():
    uow = FakeUnitOfWork()
    c1 = _make_user("consultant")
    c2 = _make_user("consultant")
    p = create_project(uow, c1, ProjectCreate(name="X", domain="legal"))
    with pytest.raises(ProjectNotFoundError):
        update_project(uow, c2, p.id, ProjectUpdate(name="Y"))
