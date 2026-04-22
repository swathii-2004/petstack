from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Cookie, Depends, File, Form, HTTPException, Response, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import EmailStr

from app.database import get_database
from app.models.user import UserLogin, UserRole
from app.services.auth_service import login_user, refresh_access_token, signup_user

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Cookie settings ────────────────────────────────────────────────────────────
_COOKIE_KEY = "refresh_token"
_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    full_name: str = Form(..., min_length=2, max_length=100),
    email: EmailStr = Form(...),
    password: str = Form(..., min_length=8),
    role: UserRole = Form(default=UserRole.user),
    phone: str | None = Form(default=None),
    license_number: str | None = Form(default=None),
    specialisation: str | None = Form(default=None),
    clinic_name: str | None = Form(default=None),
    experience_years: int | None = Form(default=None),
    business_name: str | None = Form(default=None),
    gst_number: str | None = Form(default=None),
    documents: list[UploadFile] | None = File(default=None),
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict[str, Any]:
    """Register a new user account.
    Accepts multipart/form-data for vet/seller registrations (which include files).
    """
    return await signup_user(
        full_name=full_name,
        email=email,
        password=password,
        role=role,
        phone=phone,
        license_number=license_number,
        specialisation=specialisation,
        clinic_name=clinic_name,
        experience_years=experience_years,
        business_name=business_name,
        gst_number=gst_number,
        documents=documents,
        db=db,
    )


@router.post("/login")
async def login(
    payload: UserLogin,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict:
    """Authenticate with e-mail + password.

    - Returns ``access_token`` in the JSON body.
    - Sets ``refresh_token`` as an httpOnly, Secure, SameSite=Lax cookie.
    """
    tokens = await login_user(payload.email, payload.password, db)

    response.set_cookie(
        key=_COOKIE_KEY,
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,        # set False only in local-HTTP dev if needed
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
        path="/auth/refresh",
    )

    return {"access_token": tokens["access_token"], "token_type": tokens["token_type"]}


@router.post("/refresh")
async def refresh(
    refresh_token: str | None = Cookie(default=None, alias=_COOKIE_KEY),
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict:
    """Issue a new access token using the httpOnly refresh-token cookie."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await refresh_access_token(refresh_token, db)


@router.post("/logout")
async def logout(response: Response) -> Response:
    """Clear the refresh-token cookie, effectively logging the user out."""
    response.delete_cookie(key=_COOKIE_KEY, path="/auth/refresh")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
