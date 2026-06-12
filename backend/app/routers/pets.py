from datetime import datetime
from typing import Annotated, Optional
import json

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.pet import PetCreate, PetResponse, PetUpdate
from app.models.user import UserResponse, UserRole
from app.utils.cloudinary_upload import upload_images

router = APIRouter(prefix="/pets", tags=["Pets"])


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))],
    name: str = Form(...),
    species: str = Form(...),
    breed: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    weight: Optional[float] = Form(None),
    health_notes: Optional[str] = Form(None),
    vaccinations: Optional[str] = Form(None),  # JSON string
    photo: Optional[UploadFile] = File(None),
):
    db = get_database()
    now = datetime.utcnow()
    
    vaccinations_list = []
    if vaccinations:
        try:
            vaccinations_list = json.loads(vaccinations)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid vaccinations JSON")
            
    photo_url = None
    if photo and photo.filename:
        urls = await upload_images([photo], folder="petstack/pets")
        if urls:
            photo_url = urls[0]
            
    payload = PetCreate(
        name=name,
        species=species,
        breed=breed,
        dob=dob,
        weight=weight,
        health_notes=health_notes,
        vaccinations=vaccinations_list,
        photo_url=photo_url
    )
    
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
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))],
    name: Optional[str] = Form(None),
    species: Optional[str] = Form(None),
    breed: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    weight: Optional[float] = Form(None),
    health_notes: Optional[str] = Form(None),
    vaccinations: Optional[str] = Form(None),  # JSON string
    photo: Optional[UploadFile] = File(None),
):
    db = get_database()
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
        
    if pet["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to edit this pet")
        
    vaccinations_list = None
    if vaccinations is not None:
        try:
            vaccinations_list = json.loads(vaccinations)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid vaccinations JSON")
            
    photo_url = None
    if photo and photo.filename:
        urls = await upload_images([photo], folder="petstack/pets")
        if urls:
            photo_url = urls[0]
            
    payload = PetUpdate(
        name=name,
        species=species,
        breed=breed,
        dob=dob,
        weight=weight,
        health_notes=health_notes,
        vaccinations=vaccinations_list,
        photo_url=photo_url
    )
        
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    if update_data:
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
