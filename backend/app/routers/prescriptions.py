from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.dependencies import require_role
from app.models.prescription import PrescriptionCreate, PrescriptionResponse
from app.models.user import UserResponse, UserRole
from app.utils.pdf_generator import generate_prescription_pdf
from app.utils.cloudinary_upload import upload_pdf

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    payload: PrescriptionCreate,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.vet]))]
):
    db = get_database()
    vet_id = str(current_user["_id"])
    
    # 1. Verify Appointment
    appointment = await db.appointments.find_one({"_id": ObjectId(payload.appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if appointment["vet_id"] != vet_id:
        raise HTTPException(status_code=403, detail="Not authorized to write prescription for this appointment")
        
    if appointment["status"] != "completed":
        raise HTTPException(status_code=400, detail="Cannot write prescription for an incomplete appointment")
        
    # Check if prescription already exists
    existing = await db.prescriptions.find_one({"appointment_id": payload.appointment_id})
    if existing:
        raise HTTPException(status_code=400, detail="Prescription already exists for this appointment")
        
    # 2. Gather data for PDF
    pet = await db.pets.find_one({"_id": ObjectId(appointment["pet_id"])})
    owner = await db.users.find_one({"_id": ObjectId(appointment["user_id"])})
    
    # Fetch recommended products
    recommended_products = []
    if payload.recommended_product_ids:
        cursor = db.products.find({"_id": {"$in": [ObjectId(pid) for pid in payload.recommended_product_ids]}})
        prods = await cursor.to_list(length=10)
        recommended_products = [{"name": p["name"]} for p in prods]

    # 3. Generate PDF
    prescription_data = payload.model_dump()
    pdf_bytes = generate_prescription_pdf(
        prescription_data=prescription_data,
        vet_data=current_user,
        owner_data=owner,
        pet_data=pet,
        recommended_products=recommended_products
    )
    
    # 4. Upload to Cloudinary
    pdf_url = await upload_pdf(pdf_bytes, folder="petstack/prescriptions")
    
    # 5. Save to DB
    now = datetime.utcnow()
    presc_doc = prescription_data
    presc_doc["vet_id"] = vet_id
    presc_doc["user_id"] = appointment["user_id"]
    presc_doc["pet_id"] = appointment["pet_id"]
    presc_doc["pdf_url"] = pdf_url
    presc_doc["created_at"] = now
    
    result = await db.prescriptions.insert_one(presc_doc)
    presc_doc["_id"] = result.inserted_id
    
    # Update appointment to link prescription
    await db.appointments.update_one(
        {"_id": ObjectId(payload.appointment_id)},
        {"$set": {"prescription_id": str(result.inserted_id)}}
    )
    
    return PrescriptionResponse(**presc_doc)

@router.get("/{presc_id}", response_model=PrescriptionResponse)
async def get_prescription(
    presc_id: str,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user, UserRole.vet]))]
):
    db = get_database()
    presc = await db.prescriptions.find_one({"_id": ObjectId(presc_id)})
    
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    # Only owner or vet can view
    if presc["user_id"] != str(current_user["_id"]) and presc["vet_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this prescription")
        
    return PrescriptionResponse(**presc)

@router.get("/pet/{pet_id}", response_model=list[PrescriptionResponse])
async def get_pet_prescriptions(
    pet_id: str,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
):
    db = get_database()
    
    # Verify pet ownership
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    if not pet or pet["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this pet's prescriptions")
        
    cursor = db.prescriptions.find({"pet_id": pet_id}).sort("created_at", -1)
    prescs = await cursor.to_list(length=100)
    
    return [PrescriptionResponse(**p) for p in prescs]
