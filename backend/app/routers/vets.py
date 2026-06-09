from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.user import UserResponse, UserRole
from app.models.vet import VetAvailabilityResponse, VetAvailabilityUpdate, WeeklySchedule, VetReviewCreate, VetReviewResponse

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


@router.get("/{vet_id}")
async def get_vet_by_id(vet_id: str):
    db = get_database()
    try:
        vet = await db.users.find_one({"_id": ObjectId(vet_id), "role": "vet", "status": "active"})
    except Exception:
        raise HTTPException(status_code=404, detail="Vet not found")
    
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")
    
    vet["_id"] = str(vet["_id"])
    vet.pop("hashed_password", None)
    return vet


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


@router.post("/{vet_id}/reviews", response_model=VetReviewResponse)
async def create_vet_review(
    vet_id: str,
    payload: VetReviewCreate,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
):
    db = get_database()
    
    # Verify vet exists
    vet = await db.users.find_one({"_id": ObjectId(vet_id), "role": "vet"})
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")
        
    # Verify user has at least one completed appointment with this vet
    appointment = await db.appointments.find_one({
        "user_id": str(current_user["_id"]),
        "vet_id": vet_id,
        "status": "completed"
    })
    if not appointment:
        raise HTTPException(
            status_code=403, 
            detail="You can only review vets after having a completed appointment with them."
        )
        
    now = datetime.utcnow()
    review_doc = payload.model_dump()
    review_doc["vet_id"] = vet_id
    review_doc["user_id"] = str(current_user["_id"])
    review_doc["user_name"] = current_user.get("full_name") or current_user.get("name") or "Pet Parent"
    review_doc["created_at"] = now
    
    result = await db.vet_reviews.insert_one(review_doc)
    review_doc["_id"] = result.inserted_id
    
    # Calculate and update vet's rating and review count
    cursor = db.vet_reviews.find({"vet_id": vet_id})
    all_reviews = await cursor.to_list(length=1000)
    total_rating = sum(r["rating"] for r in all_reviews)
    count = len(all_reviews)
    avg_rating = round(total_rating / count, 1) if count > 0 else 0.0
    
    await db.users.update_one(
        {"_id": ObjectId(vet_id)},
        {"$set": {"rating": avg_rating, "review_count": count}}
    )
    
    return VetReviewResponse(**review_doc)


@router.get("/{vet_id}/reviews/eligibility")
async def check_review_eligibility(
    vet_id: str,
    current_user: Annotated[UserResponse, Depends(get_current_user)]
):
    role = current_user.get("role")
    if role not in (UserRole.user.value, UserRole.admin.value):
        return {"eligible": False}
    db = get_database()
    try:
        vet = await db.users.find_one({"_id": ObjectId(vet_id), "role": "vet"})
    except Exception:
        raise HTTPException(status_code=404, detail="Vet not found")
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")
        
    appointment = await db.appointments.find_one({
        "user_id": str(current_user["_id"]),
        "vet_id": vet_id,
        "status": "completed"
    })
    return {"eligible": appointment is not None}


@router.get("/{vet_id}/reviews", response_model=list[VetReviewResponse])
async def get_vet_reviews(vet_id: str):
    db = get_database()
    cursor = db.vet_reviews.find({"vet_id": vet_id}).sort("created_at", -1)
    reviews = await cursor.to_list(length=100)
    for r in reviews:
        r["_id"] = str(r["_id"])
    return [VetReviewResponse(**r) for r in reviews]
