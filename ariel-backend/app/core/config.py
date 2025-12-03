from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # AI Provider Settings
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_AI_PROVIDER: str = "openai"  # openai, anthropic, or ollama

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ariel"

    # App Settings
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:19006"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
