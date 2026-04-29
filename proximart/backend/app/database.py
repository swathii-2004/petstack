from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from app.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
# Depending on tests, we might use a different db name, but default to 'proximart'
database = client.proximart

def get_db():
    return database

async def init_db():
    # users: email (unique), role, status
    await database.users.create_index([("email", pymongo.ASCENDING)], unique=True)
    await database.users.create_index([("role", pymongo.ASCENDING)])
    await database.users.create_index([("status", pymongo.ASCENDING)])
    
    # vendor_profiles: user_id (unique), location (2dsphere)
    await database.vendor_profiles.create_index([("user_id", pymongo.ASCENDING)], unique=True)
    await database.vendor_profiles.create_index([("location", pymongo.GEOSPHERE)])
