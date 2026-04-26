import math
from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.appointment import AppointmentBook, AppointmentResponse, AppointmentStatusUpdate, PaginatedAppointments
from app.models.user import UserResponse, UserRole

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/book", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    payload: AppointmentBook,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
):
    db = get_database()
    
    # 1. Verify Pet belongs to User
    pet = await db.pets.find_one({"_id": ObjectId(payload.pet_id)})
    if not pet or pet.get("user_id") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Invalid pet selection")

    # 2. Verify Vet exists and is active
    vet = await db.users.find_one({"_id": ObjectId(payload.vet_id), "role": "vet", "status": "active"})
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found or unavailable")
        
    # 3. Check for conflicting appointments
    conflict = await db.appointments.find_one({
        "vet_id": payload.vet_id,
        "date": payload.date,
        "time_slot": payload.time_slot,
        "status": {"$in": ["pending", "accepted"]}
    })
    
    if conflict:
        raise HTTPException(status_code=400, detail="This time slot is already booked")
        
    now = datetime.utcnow()
    app_doc = payload.model_dump()
    app_doc["user_id"] = str(current_user["_id"])
    app_doc["status"] = "pending"
    app_doc["created_at"] = now
    app_doc["updated_at"] = now
    
    result = await db.appointments.insert_one(app_doc)
    app_doc["_id"] = result.inserted_id
    
    return AppointmentResponse(**app_doc)


@router.get("/user", response_model=PaginatedAppointments)
async def get_user_appointments(
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))],
    page: int = 1,
    limit: int = 10,
    status: str | None = None
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {"user_id": str(current_user["_id"])}
    if status and status != "all":
        query["status"] = status
        
    total = await db.appointments.count_documents(query)
    cursor = db.appointments.find(query).sort("date", -1).skip(skip).limit(limit)
    appointments = await cursor.to_list(length=limit)
    
    return PaginatedAppointments(
        items=[AppointmentResponse(**a) for a in appointments],
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1
    )


@router.get("/vet/dashboard")
async def get_vet_dashboard_stats(
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.vet]))]
):
    db = get_database()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    vet_id = str(current_user["_id"])
    
    # Run counts in parallel
    import asyncio
    tasks = [
        db.appointments.count_documents({"vet_id": vet_id, "date": today_str, "status": "accepted"}),
        db.appointments.count_documents({"vet_id": vet_id, "status": "pending"}),
        db.appointments.count_documents({"vet_id": vet_id, "status": "completed"})
    ]
    
    results = await asyncio.gather(*tasks)
    
    return {
        "today_appointments": results[0],
        "pending_requests": results[1],
        "total_completed": results[2]
    }


@router.get("/vet")
async def get_vet_appointments(
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.vet]))],
    page: int = 1,
    limit: int = 10,
    status: str | None = None
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {"vet_id": str(current_user["_id"])}
    if status and status != "all":
        query["status"] = status
        
    total = await db.appointments.count_documents(query)
    cursor = db.appointments.find(query).sort("date", 1).skip(skip).limit(limit)
    appointments = await cursor.to_list(length=limit)
    
    # Enrich each appointment with pet and owner details
    enriched = []
    for appt in appointments:
        appt["_id"] = str(appt["_id"])
        
        # Fetch pet details
        try:
            pet = await db.pets.find_one({"_id": ObjectId(appt["pet_id"])})
            if pet:
                appt["pet_details"] = {
                    "name": pet.get("name"),
                    "species": pet.get("species"),
                    "breed": pet.get("breed"),
                    "dob": pet.get("dob"),
                    "weight": pet.get("weight"),
                }
        except Exception:
            appt["pet_details"] = None
            
        # Fetch owner details
        try:
            owner = await db.users.find_one({"_id": ObjectId(appt["user_id"])})
            if owner:
                appt["owner_details"] = {
                    "full_name": owner.get("full_name"),
                    "email": owner.get("email"),
                    "phone": owner.get("phone"),
                }
        except Exception:
            appt["owner_details"] = None
            
        enriched.append(appt)
    
    return {
        "items": enriched,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total > 0 else 1
    }


@router.put("/{app_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    app_id: str,
    payload: AppointmentStatusUpdate,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user, UserRole.vet]))]
):
    db = get_database()
    app = await db.appointments.find_one({"_id": ObjectId(app_id)})
    
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # Authorization logic
    if payload.status == "cancelled":
        # Only User can cancel
        if app["user_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        # Only Vet can accept/reject/complete
        if app["vet_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized")
            
    update_data = {
        "status": payload.status,
        "updated_at": datetime.utcnow()
    }
    if payload.vet_note is not None:
        update_data["vet_note"] = payload.vet_note
        
    await db.appointments.update_one(
        {"_id": ObjectId(app_id)},
        {"$set": update_data}
    )
    
    updated = await db.appointments.find_one({"_id": ObjectId(app_id)})
    return AppointmentResponse(**updated)
