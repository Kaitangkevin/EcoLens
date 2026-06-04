from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EcoLens"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:5173"
    request_timeout_seconds: float = 12.0
    openaq_api_key: str | None = None
    nasa_firms_map_key: str | None = None
    nasa_firms_source: str = "VIIRS_NOAA20_NRT"
    contact_email: str = "hello@example.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def user_agent(self) -> str:
        return f"{self.app_name}/1.0 ({self.contact_email})"


@lru_cache
def get_settings() -> Settings:
    return Settings()
