from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.user import UserResponse, UserRole
from app.models.vet import VetAvailabilityResponse, VetAvailabilityUpdate, WeeklySchedule

router = APIRouter(prefix="/vets", tags=["Vets"])


@router.get("")
async def search_vets():
    db = get_database()
    # Find active users with role vet
    cursor = db.users.find({"role": "vet", "status": "active"}).sort("full_name", 1)
    vets = await cursor.to_list(length=100)
    
    # Strip hashed_password
    safe_vets = []
    for v in vets:
        v["_id"] = str(v["_id"])
        if "hashed_password" in v:
            del v["hashed_password"]
        safe_vets.append(v)
        
    return safe_vets


@router.get("/{vet_id}/availability", response_model=VetAvailabilityResponse)
async def get_vet_availability(vet_id: str):
    db = get_database()
    avail = await db.vet_availability.find_one({"vet_id": vet_id})
    
    if not avail:
        # Return default if not set
        return VetAvailabilityResponse(
            vet_id=vet_id,
            schedule=WeeklySchedule(),
            blocked_dates=[],
            slot_duration_minutes=30,
            updated_at=datetime.utcnow()
        )
        
    return VetAvailabilityResponse(**avail)


@router.put("/me/availability", response_model=VetAvailabilityResponse)
async def update_my_availability(
    payload: VetAvailabilityUpdate,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.vet]))]
):
    db = get_database()
    now = datetime.utcnow()
    
    vet_id = str(current_user["_id"])
    
    avail_doc = payload.model_dump()
    avail_doc["vet_id"] = vet_id
    avail_doc["updated_at"] = now
    
    result = await db.vet_availability.update_one(
        {"vet_id": vet_id},
        {"$set": avail_doc},
        upsert=True
    )
    
    # Fetch latest
    updated = await db.vet_availability.find_one({"vet_id": vet_id})
    return VetAvailabilityResponse(**updated)
