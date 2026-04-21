from __future__ import annotations

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.models.user import UserCreate, UserLogin
from app.services.auth_service import login_user, refresh_access_token, signup_user

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Cookie settings ────────────────────────────────────────────────────────────
_COOKIE_KEY = "refresh_token"
_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    payload: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict:
    """Register a new user account (role=user only in Phase 1).

    Returns the access token directly so the client can authenticate immediately.
    """
    return await signup_user(payload, db)


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
