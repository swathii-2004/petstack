import asyncio
import argparse
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.utils.hashing import hash_password

async def seed_admin(email: str, password: str):
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.proximart
    
    existing = await db.users.find_one({"email": email})
    if existing:
        print("already exists")
        return
        
    admin_doc = {
        "email": email,
        "password": hash_password(password),
        "role": "admin",
        "status": "active",
        "name": "Admin"
    }
    
    await db.users.insert_one(admin_doc)
    print("Admin created successfully")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed admin user")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    
    args = parser.parse_args()
    
    asyncio.run(seed_admin(args.email, args.password))
