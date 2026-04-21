from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── MongoDB ────────────────────────────────────────────────────────────────
    MONGODB_URL: str
    DB_NAME: str

    # ── JWT ────────────────────────────────────────────────────────────────────
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Cloudinary ─────────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # ── Frontend Origins ───────────────────────────────────────────────────────
    FRONTEND_USER_URL: str
    FRONTEND_VET_URL: str
    FRONTEND_SELLER_URL: str
    FRONTEND_ADMIN_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def allowed_origins(self) -> list[str]:
        """Return all frontend origins for CORS configuration."""
        return [
            self.FRONTEND_USER_URL,
            self.FRONTEND_VET_URL,
            self.FRONTEND_SELLER_URL,
            self.FRONTEND_ADMIN_URL,
        ]


settings = Settings()  # type: ignore[call-arg]
