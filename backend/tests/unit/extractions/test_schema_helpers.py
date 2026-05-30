import pytest

from obione.extractions.coverage import (
    all_attributes,
    all_categories,
    category_of,
)


@pytest.mark.unit
def test_schema_has_44_attributes_and_8_categories():
    assert len(all_attributes()) == 44
    assert len(all_categories()) == 8


@pytest.mark.unit
def test_every_attribute_maps_to_a_known_category():
    cats = set(all_categories())
    for attr in all_attributes():
        assert category_of(attr) in cats


@pytest.mark.unit
def test_categories_are_unique_and_ordered():
    cats = all_categories()
    assert len(cats) == len(set(cats))


@pytest.mark.unit
def test_category_of_raises_on_unknown_key():
    with pytest.raises(KeyError):
        category_of("not_an_attribute_xyz")
