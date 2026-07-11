"""App configuration (env-driven, pydantic-settings)."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DEBUG: bool = True
    SECRET_KEY: str = "dev-insecure-change-me-precision-shooter"

    # Postgres (async via psycopg3).
    DATABASE_URL: str = "postgresql+psycopg://ps_app:ps_app_pw@127.0.0.1:5432/precision_shooter"
    # Redis for KPI / roster caching (NFR-002) and OTP rate limiting.
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    def model_post_init(self, __context) -> None:
        # Managed hosts (Render/Heroku/Neon) hand out postgres:// URLs;
        # normalise to SQLAlchemy's psycopg3 dialect scheme.
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
        elif self.DATABASE_URL.startswith("postgresql://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

    # JWT (spec NFR-001; using HS256 for local dev).
    ACCESS_TOKEN_MINUTES: int = 60
    REFRESH_TOKEN_DAYS: int = 30

    # Auth rules (FR-001).
    OTP_EXPIRY_SECONDS: int = 120
    OTP_MAX_RESENDS_PER_HOUR: int = 3

    # Billing (FR-002).
    TRIAL_PERIOD_DAYS: int = 90
    TRIAL_NUDGE_DAY: int = 75

    RECAPTCHA_SECRET_KEY: str = ""


settings = Settings()
