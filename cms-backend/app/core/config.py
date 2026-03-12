from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Banco de Dados
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # Criptografia (Fernet)
    FERNET_KEY: str

    # Cloudflare R2
    CF_ACCOUNT_ID: str = ""

    # CORS
    ADMIN_FRONTEND_URL: str = "http://localhost:5173"
    SUPERADMIN_URL: str = "http://localhost:5174"

    # E-mail (Resend)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@seu-cms.com.br"

    # Ambiente
    ENVIRONMENT: str = "development"

    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/15minutes"
    RATE_LIMIT_LEADS: str = "3/hour"
    RATE_LIMIT_UPLOAD: str = "20/hour"
    RATE_LIMIT_PUBLIC: str = "200/minute"


settings = Settings()
