import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


def _load_env_files() -> None:
    if load_dotenv is None:
        return

    backend_dir = Path(__file__).resolve().parents[1]
    workspace_dir = Path(__file__).resolve().parents[2]

    # Load from broadest scope to narrowest so local backend overrides can win.
    for env_path in [workspace_dir / ".env", workspace_dir / ".env.local", backend_dir / ".env", backend_dir / ".env.local"]:
        if env_path.exists():
            load_dotenv(env_path, override=False)


_load_env_files()


class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "FlashStudy AI Backend")
    app_env: str = os.getenv("APP_ENV", "development")
    app_port: int = int(os.getenv("APP_PORT", "8000"))
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
        ).split(",")
        if origin.strip()
    ]

    azure_blob_connection_string: str | None = (
        os.getenv("AZURE_BLOB_CONNECTION_STRING")
        or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    )
    azure_blob_container: str = os.getenv("AZURE_BLOB_CONTAINER", "uploads")

    azure_doc_intel_endpoint: str | None = os.getenv("AZURE_DOC_INTEL_ENDPOINT")
    azure_doc_intel_key: str | None = os.getenv("AZURE_DOC_INTEL_KEY")

    azure_openai_endpoint: str | None = os.getenv("AZURE_OPENAI_ENDPOINT")
    azure_openai_key: str | None = os.getenv("AZURE_OPENAI_KEY")
    azure_openai_api_version: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")
    azure_openai_deployment: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

    cosmos_endpoint: str | None = os.getenv("AZURE_COSMOS_ENDPOINT")
    cosmos_key: str | None = os.getenv("AZURE_COSMOS_KEY")
    cosmos_connection_string: str | None = os.getenv("AZURE_COSMOS_CONNECTION_STRING")
    cosmos_database: str = os.getenv("AZURE_COSMOS_DATABASE", "flashstudy")
    cosmos_container: str = os.getenv("AZURE_COSMOS_CONTAINER", "decks")


@lru_cache
def get_settings() -> Settings:
    return Settings()