"""Blob storage port (hexagonal architecture)."""

from typing import Protocol
from uuid import UUID


class AbstractBlobStorage(Protocol):
    def write(self, project_id: UUID, content: bytes) -> tuple[str, str]:
        """Persist content; return (sha256 hex, relative path)."""
        ...

    def read(self, relative_path: str) -> bytes: ...
