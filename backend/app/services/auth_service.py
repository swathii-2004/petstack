from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.models.user import UserInDB, UserRole, UserStatus
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token, create_refresh_token
from app.utils.validators import validate_upload_file

# ── Cloudinary initialisation ─────────────────────────────────────────────────

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _upload_files_to_cloudinary(files: list[UploadFile]) -> list[str]:
    """Validate and upload each file; return a list of secure Cloudinary URLs."""
    urls: list[str] = []
    for file in files:
        content = await validate_upload_file(file)  # raises HTTP 422 on failure
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            resource_type="auto",
            folder="petstack/docs",
            use_filename=True,
            unique_filename=True,
        )
        urls.append(result["secure_url"])
    return urls


# ── Public service functions ──────────────────────────────────────────────────


async def signup_user(
    *,
    full_name: str,
    email: str,
    password: str,
    role: UserRole,
    phone: str | None = None,
    # vet
    license_number: str | None = None,
    specialisation: str | None = None,
    clinic_name: str | None = None,
    experience_years: int | None = None,
    # seller
    business_name: str | None = None,
    gst_number: str | None = None,
    # docs
    documents: list[UploadFile] | None = None,
    db: AsyncIOMotorDatabase,  # type: ignore[type-arg]
) -> dict[str, Any]:
    """Register a new user.

    - role=user  → status=active, returns access token immediately.
    - role=vet / seller → uploads docs, status=pending, no token returned.

    Raises:
        409 – if the e-mail is already registered.
        422 – on file validation failure (propagated from validator).
    """
    # Duplicate e-mail check
    existing = await db["users"].find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this e-mail already exists.",
        )

    now = _utcnow()
    is_privileged = role in (UserRole.vet, UserRole.seller)

    # Upload documents (vet / seller only)
    doc_urls: list[str] = []
    if is_privileged and documents:
        doc_urls = await _upload_files_to_cloudinary(documents)

    user_doc: dict[str, Any] = {
        "full_name": full_name,
        "email": email,
        "hashed_password": hash_password(password),
        "role": role.value,
        "status": UserStatus.pending.value if is_privileged else UserStatus.active.value,
        "phone": phone,
        "doc_urls": doc_urls,
        "created_at": now,
        "updated_at": now,
    }

    # Role-specific fields
    if role == UserRole.vet:
        user_doc.update(
            {
                "license_number": license_number,
                "specialisation": specialisation,
                "clinic_name": clinic_name,
                "experience_years": experience_years,
            }
        )
    elif role == UserRole.seller:
        user_doc.update(
            {
                "business_name": business_name,
                "gst_number": gst_number,
            }
        )

    result = await db["users"].insert_one(user_doc)
    user_id = str(result.inserted_id)

    if is_privileged:
        return {"message": "Registration submitted. Awaiting admin approval."}

    # Regular user → return token immediately
    access_token = create_access_token({"sub": user_id, "role": role.value})
    return {"access_token": access_token, "token_type": "bearer"}


async def login_user(
    email: str,
    password: str,
    db: AsyncIOMotorDatabase,  # type: ignore[type-arg]
) -> dict[str, str]:
    """Authenticate a user and return tokens.

    Returns:
        Dict containing ``access_token``, ``token_type``, and ``refresh_token``.

    Raises:
        401 – on invalid credentials.
        403 – if the account is pending or rejected.
    """
    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = await db["users"].find_one({"email": email})
    if not user:
        raise _invalid

    account_status = user.get("status")

    if account_status == UserStatus.pending.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval.",
        )

    if account_status == UserStatus.rejected.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration was rejected. Please contact support.",
        )

    if account_status != UserStatus.active.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {account_status}. Contact support.",
        )

    if not verify_password(password, user["hashed_password"]):
        raise _invalid

    user_id = str(user["_id"])
    role = user.get("role", UserRole.user.value)

    access_token = create_access_token({"sub": user_id, "role": role})
    refresh_token = create_refresh_token({"sub": user_id, "role": role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
    }


async def refresh_access_token(
    refresh_token: str,
    db: AsyncIOMotorDatabase,  # type: ignore[type-arg]
) -> dict[str, str]:
    """Issue a new access token given a valid refresh token.

    Returns:
        Dict containing ``access_token`` and ``token_type``.

    Raises:
        401 – if the refresh token is invalid or the user no longer exists.
    """
    from bson import ObjectId
    from jose import JWTError

    from app.utils.jwt import decode_token

    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise _invalid
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise _invalid
    except JWTError:
        raise _invalid

    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise _invalid

    role = user.get("role", UserRole.user.value)
    access_token = create_access_token({"sub": user_id, "role": role})
    return {"access_token": access_token, "token_type": "bearer"}
