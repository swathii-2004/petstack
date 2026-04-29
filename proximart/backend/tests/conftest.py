import os
import pytest

# Set environment variables BEFORE any application code is imported
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["JWT_SECRET"] = "supersecretjwtkeythatisverylong"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["AES_SECRET_KEY"] = "12345678901234567890123456789012" # 32 bytes
os.environ["CLOUDINARY_CLOUD_NAME"] = "testcloud"
os.environ["CLOUDINARY_API_KEY"] = "testkey"
os.environ["CLOUDINARY_API_SECRET"] = "testsecret"

import pytest_asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

@pytest_asyncio.fixture(scope="session")
async def test_db():
    from app.config import settings
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.proximart_test
    
    # Drop database before tests
    await client.drop_database("proximart_test")
    
    # Setup indexes
    from app.database import init_db
    import app.database as app_db
    
    # Monkeypatch the database in app.database
    app_db.database = db
    await init_db()
    
    yield db
    
    # Cleanup after tests
    await client.drop_database("proximart_test")

@pytest_asyncio.fixture()
async def client(test_db):
    from app.main import app
    from app.database import get_db
    
    app.dependency_overrides[get_db] = lambda: test_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()
