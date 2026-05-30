"""Pydantic DTOs for the CBAC endpoints."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CategoryVisibilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_key: str
    visible: bool
    updated_at: datetime


class AttributeVisibilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attribute_key: str
    visible: bool
    updated_at: datetime


class VisibilityStateResponse(BaseModel):
    categories: list[CategoryVisibilityResponse]
    overrides: list[AttributeVisibilityResponse]
    resolved: dict[str, bool]


class SetVisibilityRequest(BaseModel):
    visible: bool


class CategoryVisibilityInput(BaseModel):
    category_key: str
    visible: bool


class AttributeVisibilityInput(BaseModel):
    attribute_key: str
    visible: bool


class BulkVisibilityRequest(BaseModel):
    categories: list[CategoryVisibilityInput] = []
    overrides: list[AttributeVisibilityInput] = []
