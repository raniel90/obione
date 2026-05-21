import uuid

import pytest

from obione.documents.storage.filesystem import FilesystemBlobStorage


@pytest.mark.unit
def test_write_returns_hash_and_path(tmp_path):
    storage = FilesystemBlobStorage(root=str(tmp_path))
    project_id = uuid.uuid4()
    sha, rel_path = storage.write(project_id, b"hello world")
    assert len(sha) == 64
    assert rel_path.endswith(".docx")
    assert (tmp_path / rel_path).exists()
    assert (tmp_path / rel_path).read_bytes() == b"hello world"


@pytest.mark.unit
def test_write_same_bytes_yields_same_hash(tmp_path):
    storage = FilesystemBlobStorage(root=str(tmp_path))
    pid = uuid.uuid4()
    sha1, _ = storage.write(pid, b"identical")
    sha2, _ = storage.write(pid, b"identical")
    assert sha1 == sha2
