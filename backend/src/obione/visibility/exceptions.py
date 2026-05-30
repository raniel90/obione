"""Visibility-specific exceptions."""

from obione.shared.exceptions import BadRequestError


class InvalidCategoryKeyError(BadRequestError):
    code = "invalid_category_key"


class InvalidAttributeKeyError(BadRequestError):
    code = "invalid_attribute_key"
