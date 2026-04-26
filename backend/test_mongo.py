import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.petstack
    # mock collection
    await db.test.insert_one({"_id": "test", "status": "pending"})
    try:
        res = await db.test.find_one_and_update(
            {"_id": "test"},
            {"$set": {"status": "active"}},
            return_document=True
        )
        print("Success:", res)
    except Exception as e:
        print("Error:", type(e), e)
asyncio.run(main())
