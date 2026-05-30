"""Tests for the CBAC resolution rule.

Rule under test: override > category > False (default oculto).
"""

import uuid

import pytest

from obione.extractions.coverage import all_attributes, all_categories, category_of
from obione.unit_of_work import FakeUnitOfWork
from obione.visibility.service import resolve_visibility


@pytest.mark.unit
def test_resolve_returns_one_entry_per_attribute():
    uow = FakeUnitOfWork()
    pid = uuid.uuid4()
    result = resolve_visibility(uow, pid)
    assert set(result.keys()) == set(all_attributes())


@pytest.mark.unit
def test_default_is_all_hidden_for_brand_new_project():
    uow = FakeUnitOfWork()
    pid = uuid.uuid4()
    result = resolve_visibility(uow, pid)
    assert all(v is False for v in result.values())


@pytest.mark.unit
def test_category_visible_propagates_to_its_attributes():
    uow = FakeUnitOfWork()
    pid = uuid.uuid4()
    target = all_categories()[0]
    uow.visibility.upsert_category(pid, target, True)
    result = resolve_visibility(uow, pid)
    for attr in all_attributes():
        if category_of(attr) == target:
            assert result[attr] is True
        else:
            assert result[attr] is False


@pytest.mark.unit
def test_override_beats_category_when_hiding_an_attribute():
    uow = FakeUnitOfWork()
    pid = uuid.uuid4()
    target = all_categories()[0]
    uow.visibility.upsert_category(pid, target, True)
    sample = next(a for a in all_attributes() if category_of(a) == target)
    uow.visibility.upsert_attribute(pid, sample, False)
    result = resolve_visibility(uow, pid)
    assert result[sample] is False


@pytest.mark.unit
def test_override_can_opt_in_an_attribute_inside_a_hidden_category():
    uow = FakeUnitOfWork()
    pid = uuid.uuid4()
    target = all_attributes()[0]  # category stays False by default
    uow.visibility.upsert_attribute(pid, target, True)
    result = resolve_visibility(uow, pid)
    assert result[target] is True
    assert all(v is False for k, v in result.items() if k != target)


@pytest.mark.unit
def test_hidden_category_explicitly_set_remains_hidden():
    """Explicit False on a category equals the default — kept here so the
    audit row survives even when the consultant 'restores' the default."""
    uow = FakeUnitOfWork()
    pid = uuid.uuid4()
    uow.visibility.upsert_category(pid, all_categories()[0], False)
    result = resolve_visibility(uow, pid)
    assert all(v is False for v in result.values())
