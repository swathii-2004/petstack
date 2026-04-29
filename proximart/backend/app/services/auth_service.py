from fastapi import HTTPException, UploadFile
from typing import List
from app.models.user import UserSignupUser, UserSignupVendor, UserLogin
from app.utils.hashing import hash_password, verify_password
from app.utils.encryption import encrypt
from app.services.upload_service import upload_to_cloudinary

async def signup_user(data: UserSignupUser, db) -> dict:
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "phone": encrypt(data.phone),
        "role": "user",
        "status": "active"
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return user_doc

async def signup_vendor(data: UserSignupVendor, files: List[UploadFile], db) -> dict:
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    doc_urls = []
    for file in files:
        url = await upload_to_cloudinary(file, folder="vendor_docs")
        doc_urls.append(url)
        
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "phone": encrypt(data.phone),
        "role": "vendor",
        "status": "pending"
    }
    result = await db.users.insert_one(user_doc)
    user_id = result.inserted_id
    
    profile_doc = {
        "user_id": user_id,
        "store_name": data.store_name,
        "gst_number": encrypt(data.gst_number),
        "city": data.city,
        "doc_urls": doc_urls
    }
    await db.vendor_profiles.insert_one(profile_doc)
    
    user_doc["_id"] = user_id
    return user_doc

async def login(data: UserLogin, db) -> dict:
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("status") != "active":
        if user.get("status") == "pending":
            raise HTTPException(status_code=403, detail="Account pending approval")
        elif user.get("status") == "rejected":
            raise HTTPException(status_code=403, detail="Account rejected")
        else:
            raise HTTPException(status_code=403, detail="Account is not active")
            
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")
        
    return user
