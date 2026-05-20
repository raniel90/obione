import pytest

from obione.unit_of_work import AbstractUnitOfWork, FakeUnitOfWork


class _CountingUoW(FakeUnitOfWork):
    def __init__(self):
        super().__init__()
        self.commit_count = 0
        self.rollback_count = 0

    def commit(self) -> None:
        super().commit()
        self.commit_count += 1

    def rollback(self) -> None:
        super().rollback()
        self.rollback_count += 1


@pytest.mark.unit
def test_uow_commits_explicit():
    uow = _CountingUoW()
    with uow:
        uow.commit()
    assert uow.commit_count == 1
    assert uow.rollback_count == 1


@pytest.mark.unit
def test_uow_rolls_back_on_exception():
    uow = _CountingUoW()
    with pytest.raises(RuntimeError):
        with uow:
            raise RuntimeError("boom")
    assert uow.commit_count == 0
    assert uow.rollback_count == 1


@pytest.mark.unit
def test_abstract_uow_requires_commit_rollback():
    class Incomplete(AbstractUnitOfWork):
        pass

    with pytest.raises(TypeError):
        Incomplete()
