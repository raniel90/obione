import json
import logging

import pytest

from obione.shared.logging import JsonFormatter, configure_logging


@pytest.mark.unit
def test_json_formatter_produces_valid_json():
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="obione.test",
        level=logging.INFO,
        pathname="x.py",
        lineno=1,
        msg="hello %s",
        args=("world",),
        exc_info=None,
    )
    out = formatter.format(record)
    parsed = json.loads(out)
    assert parsed["msg"] == "hello world"
    assert parsed["level"] == "INFO"
    assert parsed["logger"] == "obione.test"
    assert "ts" in parsed


@pytest.mark.unit
def test_json_formatter_includes_extras():
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="x",
        level=logging.INFO,
        pathname="x.py",
        lineno=1,
        msg="m",
        args=None,
        exc_info=None,
    )
    record.request_id = "abc-123"
    record.user_id = "user-1"
    parsed = json.loads(formatter.format(record))
    assert parsed["request_id"] == "abc-123"
    assert parsed["user_id"] == "user-1"


@pytest.mark.unit
def test_configure_logging_plain(capsys):
    configure_logging(level="INFO", fmt="plain")
    logging.getLogger("obione.test").info("hello")
    captured = capsys.readouterr()
    assert "hello" in captured.err or "hello" in captured.out
