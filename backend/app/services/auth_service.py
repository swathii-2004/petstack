from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserCreate, UserInDB, UserRole, UserStatus
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token, create_refresh_token


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


async def signup_user(
    payload: UserCreate,
    db: AsyncIOMotorDatabase,  # type: ignore[type-arg]
) -> dict[str, str]:
    """Register a new user (role=user only in Phase 1).

    Returns:
        Dict containing ``access_token`` and ``token_type``.

    Raises:
        409 – if the e-mail is already registered.
    """
    # Duplicate e-mail check
    existing = await db["users"].find_one({"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this e-mail already exists.",
        )

    now = _utcnow()
    user_doc: dict[str, Any] = {
        "full_name": payload.full_name,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "role": UserRole.user.value,
        "status": UserStatus.active.value,
        "created_at": now,
        "updated_at": now,
    }

    result = await db["users"].insert_one(user_doc)
    user_id = str(result.inserted_id)

    access_token = create_access_token({"sub": user_id, "role": UserRole.user.value})
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
        401 – on invalid credentials or non-active status.
    """
    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = await db["users"].find_one({"email": email})
    if not user:
        raise _invalid

    if user.get("status") != UserStatus.active.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.get('status')}. Contact support.",
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
    from jose import JWTError

    from app.utils.jwt import decode_token
    from bson import ObjectId

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
