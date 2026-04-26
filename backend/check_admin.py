import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["petstack"]
    cursor = db.users.find({"email": "admin@gmail.com"})
    users = await cursor.to_list(length=10)
    for u in users:
        print(f"ID: {u['_id']}, Role: {u['role']}, Email: {u['email']}")

if __name__ == "__main__":
    asyncio.run(check())
