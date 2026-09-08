import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Local General Store API"
    ENVIRONMENT: str = "development"
    
    # Neon PostgreSQL or local DB connection string
    DATABASE_URL: str = "sqlite:///./store.db"
    
    # JWT Authentication settings
    JWT_SECRET: str = "supersecretjwtkey_change_in_production_ecomm_general_store_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days default
    
    # CORS allowed origins
    FRONTEND_URL: Union[str, List[str]] = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            # Render/Neon may use 'postgres://' which SQLAlchemy 2.0 deprecated in favor of 'postgresql://'
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
        return v

    @property
    def cors_origins(self) -> List[str]:
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]
        if isinstance(self.FRONTEND_URL, str):
            origins = [origin.strip() for origin in self.FRONTEND_URL.split(",") if origin.strip()]
        else:
            origins = list(self.FRONTEND_URL)
        
        all_origins = list(set(defaults + origins))
        return all_origins


settings = Settings()
