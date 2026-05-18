# backend/app/config.py
# Add GEMINI_API_KEY to your existing settings class.
# Full file shown — merge with your existing config carefully.

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Existing settings (keep yours)
    DATABASE_URL: str = ""
    JWT_SECRET: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DEBUG: bool = False

    # ── Phase 4: AI ──────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()