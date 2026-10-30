from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://finanzas:finanzas@localhost:5432/finanzas_familiares"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_IDS: Optional[str] = None
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"
    INVITATION_LINK_BASE: str = "http://localhost:3000/invite"

    class Config:
        env_file = ".env"


settings = Settings()
