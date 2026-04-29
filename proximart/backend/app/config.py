from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    AES_SECRET_KEY: str
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    FRONTEND_USER_URL: str = "http://localhost:3000"
    FRONTEND_VENDOR_URL: str = "http://localhost:3001"
    FRONTEND_ADMIN_URL: str = "http://localhost:3002"
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = ""

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

if len(settings.AES_SECRET_KEY) != 32:
    raise ValueError("AES_SECRET_KEY must be exactly 32 bytes/characters long.")
