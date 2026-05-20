import pytest

from obione.shared.exceptions import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ObioneException,
    UnauthorizedError,
)


@pytest.mark.unit
@pytest.mark.parametrize(
    "exc_cls,expected_status,expected_code",
    [
        (BadRequestError, 400, "bad_request"),
        (UnauthorizedError, 401, "unauthorized"),
        (ForbiddenError, 403, "forbidden"),
        (NotFoundError, 404, "not_found"),
        (ConflictError, 409, "conflict"),
    ],
)
def test_exception_defaults(exc_cls, expected_status, expected_code):
    e = exc_cls("something went wrong")
    assert isinstance(e, ObioneException)
    assert e.status_code == expected_status
    assert e.code == expected_code
    assert str(e) == "something went wrong"


@pytest.mark.unit
def test_subclass_can_override_code():
    class FooError(BadRequestError):
        code = "foo"

    assert FooError("x").code == "foo"
    assert FooError("x").status_code == 400
