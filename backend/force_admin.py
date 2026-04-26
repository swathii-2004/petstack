import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def force_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["petstack"]
    
    # Check all users with admin@gmail.com
    users = await db.users.find({"email": "admin@gmail.com"}).to_list(100)
    print(f"Found {len(users)} users with admin@gmail.com")
    
    if len(users) > 1:
        # Delete all but one, or just rename them
        for u in users:
            print(f"- {u['_id']}: {u['role']}")
            if u["role"] != "admin":
                print(f"  Changing email of non-admin to {u['_id']}@gmail.com")
                await db.users.update_one({"_id": u["_id"]}, {"$set": {"email": f"olduser_{u['_id']}@gmail.com"}})
    
    # Ensure there is exactly one admin with admin@gmail.com and admin123
    admin = await db.users.find_one({"role": "admin", "email": "admin@gmail.com"})
    if not admin:
        print("Creating fresh admin admin@gmail.com")
        await db.users.insert_one({
            "full_name": "Super Admin",
            "email": "admin@gmail.com",
            "hashed_password": hash_password("admin123"),
            "role": "admin",
            "status": "active"
        })
    else:
        print("Updating existing admin password")
        await db.users.update_one({"_id": admin["_id"]}, {"$set": {"hashed_password": hash_password("admin123")}})
        
    print("DONE! You can now log in with admin@gmail.com / admin123")
    
if __name__ == "__main__":
    asyncio.run(force_admin())
