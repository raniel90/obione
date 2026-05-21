"""Typed app settings loaded from environment variables / .env file."""

from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str

    # Auth — JWT
    JWT_SECRET: SecretStr = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    # Storage
    STORAGE_BACKEND: Literal["filesystem"] = "filesystem"
    STORAGE_ROOT: str = "/app/storage"
    MAX_UPLOAD_SIZE_MB: int = 50

    # LLM (Sprint 2)
    LLM_PROVIDER: str = "mock"
    LLM_BASE_URL: str | None = None
    LLM_API_KEY: SecretStr | None = None

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Observability
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    LOG_FORMAT: Literal["json", "plain"] = "plain"


settings = Settings()
