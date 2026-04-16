from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    kafka_bootstrap_servers: str = "localhost:9092"
    weaviate_url: str = "http://localhost:8080"
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "ekap_minio"
    minio_secret_key: str = "ekap_minio_secret_dev"

    class Config:
        env_file = ".env"

settings = Settings()
