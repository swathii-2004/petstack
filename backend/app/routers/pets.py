from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.pet import PetCreate, PetResponse, PetUpdate
from app.models.user import UserResponse, UserRole

router = APIRouter(prefix="/pets", tags=["Pets"])


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    payload: PetCreate,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
):
    db = get_database()
    now = datetime.utcnow()
    
    pet_doc = payload.model_dump()
    pet_doc["user_id"] = str(current_user["_id"])
    pet_doc["created_at"] = now
    pet_doc["updated_at"] = now
    
    result = await db.pets.insert_one(pet_doc)
    pet_doc["_id"] = result.inserted_id
    
    return PetResponse(**pet_doc)


@router.get("", response_model=list[PetResponse])
async def get_my_pets(
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
):
    db = get_database()
    cursor = db.pets.find({"user_id": str(current_user["_id"])}).sort("created_at", -1)
    pets = await cursor.to_list(length=100)
    return [PetResponse(**pet) for pet in pets]


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: str,
    payload: PetUpdate,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
):
    db = get_database()
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
        
    if pet["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to edit this pet")
        
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.pets.update_one(
        {"_id": ObjectId(pet_id)},
        {"$set": update_data}
    )
    
    updated_pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    return PetResponse(**updated_pet)


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: str,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
):
    db = get_database()
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
        
    if pet["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this pet")
        
    await db.pets.delete_one({"_id": ObjectId(pet_id)})
