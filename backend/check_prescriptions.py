import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_database(settings.DB_NAME)
    
    appts = await db.appointments.find({'status': 'completed'}).to_list(10)
    for a in appts:
        print(f"Appointment: {a['_id']}, status: {a['status']}, prescription_id: {a.get('prescription_id')}")
        
    prescs = await db.prescriptions.find({}).to_list(10)
    for p in prescs:
        print(f"Prescription: {p['_id']}, appointment_id: {p.get('appointment_id')}, pdf_url: {p.get('pdf_url')}")

asyncio.run(main())
