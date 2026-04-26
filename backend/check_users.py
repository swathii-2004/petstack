import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def show_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["petstack"]
    users = await db.users.find({}).to_list(100)
    for u in users:
        print(f"[{u.get('role')}] {u.get('email')}")

if __name__ == "__main__":
    asyncio.run(show_users())
