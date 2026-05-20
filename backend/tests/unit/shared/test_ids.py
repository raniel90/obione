import uuid

import pytest

from obione.shared.ids import new_id


@pytest.mark.unit
def test_new_id_returns_uuid4():
    result = new_id()
    assert isinstance(result, uuid.UUID)
    assert result.version == 4


@pytest.mark.unit
def test_new_id_unique():
    ids = {new_id() for _ in range(100)}
    assert len(ids) == 100
