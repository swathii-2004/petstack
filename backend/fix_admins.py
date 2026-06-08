import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def main():
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    admin_email = settings.ADMIN_EMAIL.lower()
    print(f"Designated admin email: {admin_email}")
    
    # Find all rogue admins
    rogue_admins = await db.users.find({
        "role": "admin", 
        "email": {"$regex": f"^(?!{admin_email}$).*", "$options": "i"}
    }).to_list(length=100)
    
    print(f"Found {len(rogue_admins)} rogue admin(s).")
    for user in rogue_admins:
        print(f" - Demoting: {user.get('email')} (clerk_id: {user.get('clerk_id')})")
        
    # Update them to "user"
    result = await db.users.update_many(
        {
            "role": "admin", 
            "email": {"$regex": f"^(?!{admin_email}$).*", "$options": "i"}
        },
        {"$set": {"role": "user"}}
    )
    
    print(f"Successfully demoted {result.modified_count} users.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
