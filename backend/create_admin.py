import asyncio
import os
from datetime import datetime, timezone

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "petstack")

def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")

async def create_admin():
    print(f"Connecting to {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    email = "test@admin.com"
    password = "admin123"
    now = datetime.now(tz=timezone.utc)
    hashed = hash_password(password)
    
    admin_doc = {
        "full_name": "Test Admin",
        "email": email,
        "hashed_password": hashed,
        "role": "admin",
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }

    try:
        # If there's an existing admin with this email, delete it first
        await db["users"].delete_many({"email": email})
        await db["users"].insert_one(admin_doc)
        print(f"✅ Admin {email} created successfully!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
