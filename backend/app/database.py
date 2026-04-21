from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

_client: AsyncIOMotorClient | None = None  # type: ignore[type-arg]


async def connect_db() -> None:
    """Open the Motor connection pool.  Call on application startup."""
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)


async def close_db() -> None:
    """Close the Motor connection pool.  Call on application shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_database() -> AsyncIOMotorDatabase:  # type: ignore[type-arg]
    """Return the active database instance.

    Raises:
        RuntimeError: if the database connection has not been initialised yet.
    """
    if _client is None:
        raise RuntimeError(
            "Database client is not initialised. "
            "Make sure connect_db() was called on startup."
        )
    return _client[settings.DB_NAME]
