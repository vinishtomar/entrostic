from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at the repo root, one level above backend/
ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_DIR / ".env", extra="ignore")

    app_name: str = "Entrostic HR Platform"
    database_url: str = "postgresql+psycopg://entrostic:entrostic@localhost:5433/entrostic"

    anthropic_api_key: str = ""
    claude_model: str = "claude-opus-5-5"

    upload_dir: Path = ROOT_DIR / "uploads"
    max_upload_mb: int = 10
    cors_origins: str = "http://localhost:3000"

    # Recruiter login sessions
    session_cookie_name: str = "entrostic_session"
    session_days: int = 14
    cookie_secure: bool = False  # set True in production (HTTPS only)

    # Interactive API docs at /docs. Turn off in production.
    expose_docs: bool = True

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, v: str) -> str:
        # Hosting platforms (e.g. Railway) hand out postgres:// or postgresql:// URLs;
        # SQLAlchemy needs the driver named explicitly.
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    @field_validator("upload_dir")
    @classmethod
    def _resolve_upload_dir(cls, v: Path) -> Path:
        # Relative paths in .env are relative to the repo root, not the current directory.
        return v if v.is_absolute() else (ROOT_DIR / v).resolve()

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
