"""Wiring of storage adapter selected by settings."""
from obione.documents.storage.filesystem import FilesystemBlobStorage
from obione.documents.storage.port import AbstractBlobStorage
from obione.settings import settings


def get_blob_storage() -> AbstractBlobStorage:
    if settings.STORAGE_BACKEND == "filesystem":
        return FilesystemBlobStorage(root=settings.STORAGE_ROOT)
    raise ValueError(f"Unknown STORAGE_BACKEND: {settings.STORAGE_BACKEND}")
