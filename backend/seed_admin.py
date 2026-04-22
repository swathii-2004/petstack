# Run with: python seed_admin.py
import asyncio
import os
from datetime import datetime, timezone
import getpass

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables from .env
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
    
    # Check if admin exists
    admin_exists = await db["users"].find_one({"role": "admin"})
    if admin_exists:
        print("Admin already exists")
        client.close()
        return

    # Prompt for admin details
    print("Creating new admin user...")
    email = input("Admin Email: ").strip()
    
    # Use getpass for password to not show it on terminal
    # but the instructions said "use input() prompts". I will use input() for both or getpass for password.
    # Instruction: "email and password taken as CLI input (use input() prompts)"
    password = input("Admin Password: ").strip()

    now = datetime.now(tz=timezone.utc)
    
    admin_doc = {
        "full_name": "Admin",
        "email": email,
        "hashed_password": hash_password(password),
        "role": "admin",
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }

    await db["users"].insert_one(admin_doc)
    print("Admin created successfully")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())
