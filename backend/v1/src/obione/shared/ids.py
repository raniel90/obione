"""UUID helpers. Using v4 everywhere to avoid sequential ID leakage."""

import uuid


def new_id() -> uuid.UUID:
    return uuid.uuid4()
