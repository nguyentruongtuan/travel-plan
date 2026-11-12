from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "travel_plan"

    # Firebase project ID used to verify ID tokens issued by Firebase Auth.
    firebase_project_id: str = ""

    # Local development only: accept the literal bearer token "dev" as a fake user.
    # Never enable in production.
    auth_dev_bypass: bool = False

    upload_dir: str = "/data/uploads"
    upload_max_bytes: int = 10 * 1024 * 1024
    public_upload_path: str = "/uploads"

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8080"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
