"""
Centralized application settings using Pydantic BaseSettings.

All configuration values are loaded from environment variables or the
.env file at the project root. Services import `settings` from this
module instead of reading os.environ directly.
"""

import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings
from pydantic import Field


# Resolve the ai_service/ root directory (two levels up from config/)
_APP_DIR = Path(__file__).resolve().parent.parent
_PROJECT_DIR = _APP_DIR.parent


class Settings(BaseSettings):
    """Application-wide settings loaded from .env file."""

    # --- Server ---
    FASTAPI_HOST: str = Field(default="0.0.0.0", description="Host to bind the FastAPI server")
    FASTAPI_PORT: int = Field(default=8000, description="Port for the FastAPI server")
    ENV: str = Field(default="development", description="Runtime environment")

    # --- CORS ---
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5000", "http://localhost:5173", os.getenv("FRONTEND_URL", "")],
        description="Allowed CORS origins",
    )

    # --- Redis ---
    REDIS_URL: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL for session and result caching",
    )

    # --- External Services ---
    OPENAI_API_KEY: str = Field(
        default="",
        description="OpenAI API Key for AI features",
    )
    DATABASE_URL: str = Field(
        default="",
        description="Database connection string",
    )

    # --- Model & Data Directories ---
    MODEL_DIR: str = Field(
        default=str(_APP_DIR / "models" / "trained_models"),
        description="Directory for saved sklearn model files (.pkl)",
    )
    VECTOR_DIR: str = Field(
        default=str(_APP_DIR / "models" / "vector_models"),
        description="Directory for sentence-transformer embedding files",
    )
    DATA_DIR: str = Field(
        default=str(_APP_DIR / "data"),
        description="Directory containing CSV training datasets",
    )

    model_config = {
        "env_file": str(_PROJECT_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton instance used throughout the application
settings = Settings()
