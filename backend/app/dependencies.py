from __future__ import annotations

import json
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.database import get_database
from app.models.user import UserRole

_bearer = HTTPBearer()

# ── Clerk JWKS cache ──────────────────────────────────────────────────────────
_clerk_jwks: dict | None = None


async def _get_clerk_jwks() -> dict:
    """Fetch and cache Clerk's JSON Web Key Set."""
    global _clerk_jwks
    if _clerk_jwks is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.clerk.com/v1/jwks",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
            )
            resp.raise_for_status()
            _clerk_jwks = resp.json()
    return _clerk_jwks


async def _verify_clerk_token(token: str) -> dict[str, Any]:
    """Verify a Clerk-issued JWT and return its payload.

    Raises:
        HTTPException 401 – if the token is invalid or unverifiable.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        jwks = await _get_clerk_jwks()
        # jose can verify against a JWKS dict directly
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except (JWTError, Exception):
        raise credentials_exception


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> dict[str, Any]:
    """FastAPI dependency that verifies the Clerk Bearer JWT and returns the user document.

    Flow:
    1. Verify token with Clerk's JWKS.
    2. Extract ``sub`` (Clerk user ID).
    3. Look up our MongoDB users collection by ``clerk_id``.
    4. If not found → auto-create for role=user (first-time login).

    Raises:
        401 – token missing, malformed, or expired.
        403 – account is pending/rejected/deactivated.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = await _verify_clerk_token(credentials.credentials)
    clerk_user_id: str | None = payload.get("sub")
    if not clerk_user_id:
        raise credentials_exception

    # Look up user in our DB by clerk_id
    user = await db["users"].find_one({"clerk_id": clerk_user_id})
    if not user:
        raise credentials_exception

    return user


def require_role(roles: list[UserRole]):
    """Factory that returns a dependency enforcing one of the given *roles*.

    Usage::

        @router.get("/admin-only")
        async def admin_endpoint(user=Depends(require_role([UserRole.admin]))):
            ...
    """

    async def _guard(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        allowed_roles = [r.value for r in roles]
        # Allow admin to access user endpoints
        # Allow admin, vet, and seller to access user endpoints
        if UserRole.user.value in allowed_roles:
            for r in [UserRole.admin.value, UserRole.vet.value, UserRole.seller.value]:
                if r not in allowed_roles:
                    allowed_roles.append(r)
            
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        return current_user

    return _guard


def require_active(roles: list[UserRole]):
    """Like require_role but also enforces status=active (for seller/vet dashboard access)."""

    async def _guard(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        allowed_roles = [r.value for r in roles]
        # Allow admin, vet, and seller to access user endpoints
        if UserRole.user.value in allowed_roles:
            for r in [UserRole.admin.value, UserRole.vet.value, UserRole.seller.value]:
                if r not in allowed_roles:
                    allowed_roles.append(r)

        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        account_status = current_user.get("status")
        if account_status == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending admin approval.",
            )
        if account_status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account registration was rejected.",
            )
        if account_status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is {account_status}. Contact support.",
            )
        return current_user

    return _guard
