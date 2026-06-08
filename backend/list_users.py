import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    users = await db.users.find({}).to_list(length=100)
    for u in users:
        print(f"User: {u.get('full_name')} | Email: {u.get('email')} | Role: {u.get('role')} | Status: {u.get('status')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
