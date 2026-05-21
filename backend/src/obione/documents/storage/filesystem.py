"""Filesystem adapter for AbstractBlobStorage + in-memory fake for tests."""

import hashlib
from pathlib import Path
from uuid import UUID


class FilesystemBlobStorage:
    def __init__(self, root: str):
        self._root = Path(root)

    def _relative(self, project_id: UUID, sha: str) -> str:
        return f"documents/{project_id}/{sha}.docx"

    def write(self, project_id: UUID, content: bytes) -> tuple[str, str]:
        sha = hashlib.sha256(content).hexdigest()
        rel = self._relative(project_id, sha)
        abs_path = self._root / rel
        abs_path.parent.mkdir(parents=True, exist_ok=True)
        abs_path.write_bytes(content)
        return sha, rel

    def read(self, relative_path: str) -> bytes:
        return (self._root / relative_path).read_bytes()


class FakeBlobStorage:
    """In-memory blob storage for unit tests."""

    def __init__(self):
        self._blobs: dict[str, bytes] = {}

    def write(self, project_id: UUID, content: bytes) -> tuple[str, str]:
        sha = hashlib.sha256(content).hexdigest()
        rel = f"documents/{project_id}/{sha}.docx"
        self._blobs[rel] = content
        return sha, rel

    def read(self, relative_path: str) -> bytes:
        return self._blobs[relative_path]
