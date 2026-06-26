from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import EmailStr

from app.config import settings
from app.database import get_database
from app.dependencies import get_current_user, _verify_clerk_token
from app.models.user import UserRole, UserStatus
from app.utils.validators import validate_upload_file

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Cloudinary initialisation ─────────────────────────────────────────────────
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


async def _upload_files(files: list[UploadFile]) -> list[str]:
    urls: list[str] = []
    for file in files:
        content = await validate_upload_file(file)
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            resource_type="auto",
            folder="petstack/docs",
            use_filename=True,
            unique_filename=True,
        )
        urls.append(result["secure_url"])
    return urls


# ── STEP 1: Clerk OAuth callback → sync user into our DB ─────────────────────

_bearer = HTTPBearer()


@router.post("/sync-user", status_code=status.HTTP_200_OK)
async def sync_user(
    clerk_id: str = Form(...),
    email: str = Form(...),
    full_name: str = Form(...),
    role: UserRole = Form(default=UserRole.user),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict[str, Any]:
    """Called immediately after Clerk OAuth succeeds on the frontend.

    - Verifies Clerk JWT bearer token to prevent spoofing.
    - If the user already exists (by clerk_id or email) → return existing record.
    - If new → create with status=active (user) or status=pending (seller/vet).
    """
    # ── Verify Token ──────────────────────────────────────────────────────────
    try:
        payload = await _verify_clerk_token(credentials.credentials)
        token_clerk_id = payload.get("sub")
        if not token_clerk_id or token_clerk_id != clerk_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Clerk token sub reference")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Clerk authentication failed: {str(e)}")

    print(f"--- [sync_user] Starting sync for email: {email}, clerk_id: {clerk_id}, requested_role: {role.value} ---")
    now = _utcnow()

    # Check if this user is the designated admin based on email
    is_designated_admin = (email.lower() == settings.ADMIN_EMAIL.lower())
    print(f"[sync_user] Designated ADMIN_EMAIL in config is: {settings.ADMIN_EMAIL}")
    print(f"[sync_user] is_designated_admin check: {is_designated_admin}")
    
    if is_designated_admin:
        print("[sync_user] Elevating role to 'admin' due to email match.")
        role = UserRole.admin
    elif role == UserRole.admin:
        print("[sync_user] SECURITY WARNING: Non-designated user attempted to claim 'admin' role. Downgrading to 'user'.")
        role = UserRole.user

    # Check by clerk_id first
    existing = await db["users"].find_one({"clerk_id": clerk_id})
    if existing:
        print(f"[sync_user] Found existing user by clerk_id. Current role: {existing.get('role')}")
        # If they are the designated admin but don't have the admin role yet, update them
        if is_designated_admin and existing.get("role") != "admin":
            print("[sync_user] Upgrading existing user to admin role!")
            await db["users"].update_one(
                {"_id": existing["_id"]},
                {"$set": {"role": "admin", "status": "active"}}
            )
            existing["role"] = "admin"
            existing["status"] = "active"
        # Security check: Downgrade rogue admins
        elif not is_designated_admin and existing.get("role") == "admin":
            print("[sync_user] SECURITY WARNING: Downgrading rogue admin to 'user'!")
            await db["users"].update_one(
                {"_id": existing["_id"]},
                {"$set": {"role": "user"}}
            )
            existing["role"] = "user"
            
        existing["id"] = str(existing.pop("_id"))
        existing.pop("hashed_password", None)
        print(f"[sync_user] Returning existing user (clerk_id match): {existing}")
        return {"user": existing, "is_new": False}

    # Check by email (existing user before Clerk migration)
    existing_by_email = await db["users"].find_one({"email": email})
    if existing_by_email:
        print(f"[sync_user] Found existing user by email. Current role: {existing_by_email.get('role')}")
        # Link clerk_id to existing account
        update_fields = {"clerk_id": clerk_id, "updated_at": now}
        
        if is_designated_admin:
            print("[sync_user] Upgrading existing user to admin role!")
            update_fields["role"] = "admin"
            update_fields["status"] = "active"
            existing_by_email["role"] = "admin"
            existing_by_email["status"] = "active"
        # Security check: Downgrade rogue admins
        elif not is_designated_admin and existing_by_email.get("role") == "admin":
            print("[sync_user] SECURITY WARNING: Downgrading rogue admin to 'user'!")
            update_fields["role"] = "user"
            existing_by_email["role"] = "user"
            
        await db["users"].update_one(
            {"email": email},
            {"$set": update_fields},
        )
        existing_by_email["id"] = str(existing_by_email.pop("_id"))
        existing_by_email.pop("hashed_password", None)
        print(f"[sync_user] Returning existing user (email match): {existing_by_email}")
        return {"user": existing_by_email, "is_new": False}

    print("[sync_user] User not found. Creating new user.")
    # New user — create record
    is_privileged = role in (UserRole.vet, UserRole.seller)
    
    # Admins bypass the pending status
    final_status = UserStatus.active.value
    if is_privileged and not is_designated_admin:
        final_status = UserStatus.pending.value
        
    user_doc: dict[str, Any] = {
        "clerk_id": clerk_id,
        "full_name": full_name,
        "email": email,
        "role": role.value,
        "status": final_status,
        "phone": None,
        "doc_urls": [],
        "created_at": now,
        "updated_at": now,
    }

    result = await db["users"].insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    user_doc.pop("_id", None)

    print(f"[sync_user] Created new user: {user_doc}")
    return {"user": user_doc, "is_new": True}


# ── STEP 2: Seller document upload ───────────────────────────────────────────

@router.patch("/users/me/seller-documents", status_code=status.HTTP_200_OK)
async def upload_seller_documents(
    business_name: str = Form(...),
    gst_number: str = Form(...),
    phone: str | None = Form(default=None),
    documents: list[UploadFile] | None = File(default=None),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict[str, Any]:
    """Upload seller documents and profile info. Sets status → pending."""
    from bson import ObjectId

    doc_urls: list[str] = []
    if documents:
        doc_urls = await _upload_files(documents)

    update: dict[str, Any] = {
        "business_name": business_name,
        "gst_number": gst_number,
        "phone": phone,
        "status": UserStatus.pending.value,
        "updated_at": _utcnow(),
    }
    if doc_urls:
        update["doc_urls"] = doc_urls

    await db["users"].update_one({"_id": ObjectId(str(current_user["_id"]))}, {"$set": update})
    return {"message": "Documents submitted. Awaiting admin approval."}


# ── STEP 3: Vet document upload ──────────────────────────────────────────────

@router.patch("/users/me/vet-documents", status_code=status.HTTP_200_OK)
async def upload_vet_documents(
    license_number: str = Form(...),
    specialisation: str = Form(...),
    clinic_name: str = Form(...),
    experience_years: int = Form(...),
    phone: str | None = Form(default=None),
    documents: list[UploadFile] | None = File(default=None),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict[str, Any]:
    """Upload vet documents and profile info. Sets status → pending."""
    from bson import ObjectId

    doc_urls: list[str] = []
    if documents:
        doc_urls = await _upload_files(documents)

    update: dict[str, Any] = {
        "license_number": license_number,
        "specialisation": specialisation,
        "clinic_name": clinic_name,
        "experience_years": experience_years,
        "phone": phone,
        "status": UserStatus.pending.value,
        "updated_at": _utcnow(),
    }
    if doc_urls:
        update["doc_urls"] = doc_urls

    await db["users"].update_one({"_id": ObjectId(str(current_user["_id"]))}, {"$set": update})
    return {"message": "Documents submitted. Awaiting admin approval."}


# ── GET current user profile ──────────────────────────────────────────────────

@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Return the currently authenticated user's profile."""
    user = dict(current_user)
    user["id"] = str(user.pop("_id", ""))
    user.pop("hashed_password", None)
    return user
