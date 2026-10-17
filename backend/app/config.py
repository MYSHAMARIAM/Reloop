import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_SQLITE_URL = f"sqlite:///{DATA_DIR / 'reloop.db'}"

class Settings(BaseSettings):
    APP_NAME: str = "Reloop API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    ALLOW_DEMO_DURATIONS: bool = os.getenv("ALLOW_DEMO_DURATIONS", "True").lower() in ("true", "1")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)
    
    # Security
    SESSION_SECRET_KEY: str = os.getenv("SESSION_SECRET_KEY", "reloop-college-dev-secret-change-in-production-2026")
    SESSION_COOKIE_NAME: str = "reloop_session"
    SESSION_MAX_AGE_SECONDS: int = 60 * 60 * 24 * 7  # 7 days
    CSRF_COOKIE_NAME: str = "reloop_csrf"
    
    # Cookie security (secure=False on localhost HTTP, True on HTTPS production)
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "False").lower() in ("true", "1")
    COOKIE_SAMESITE: str = "lax"
    
    # Bidding and Seller Selection Rules
    SELECTION_EXPIRY_HOURS: int = 24  # Selected bidder has 24 hours to accept/decline
    
    # Allowed CORS Origins for local frontend
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
