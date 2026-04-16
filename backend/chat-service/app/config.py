from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    postgres_url: str = "postgresql+asyncpg://ekap:ekap_dev@localhost:5432/ekap"
    redis_url: str = "redis://localhost:6379"
    weaviate_url: str = "http://localhost:8080"
    hr_service_url: str = "http://localhost:8081"

    class Config:
        env_file = ".env"

settings = Settings()
