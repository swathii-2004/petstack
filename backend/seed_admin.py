# Run with: python seed_admin.py
import asyncio
import os
from datetime import datetime, timezone

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "petstack")


def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain.encode("utf-8"), salt)
    return hashed.decode("utf-8")


async def seed_admin():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    print("\n=== Admin Setup ===")

    email = input("Admin Email: ").strip()
    password = input("Admin Password: ").strip()

    now = datetime.now(tz=timezone.utc)
    hashed = hash_password(password)

    # Check if admin exists
    admin_exists = await db["users"].find_one({"role": "admin"})

    if admin_exists:
        # Update existing admin
        await db["users"].update_one(
            {"_id": admin_exists["_id"]},
            {
                "$set": {
                    "email": email,
                    "hashed_password": hashed,
                    "updated_at": now,
                }
            }
        )
        print("✅ Admin password updated successfully")
    else:
        # Create new admin
        admin_doc = {
            "full_name": "Admin",
            "email": email,
            "hashed_password": hashed,
            "role": "admin",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }

        await db["users"].insert_one(admin_doc)
        print("✅ Admin created successfully")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed_admin())