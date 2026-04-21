from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import settings

# ── Token type constants ───────────────────────────────────────────────────────
_ACCESS = "access"
_REFRESH = "refresh"


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _build_token(data: dict[str, Any], expires_delta: timedelta, token_type: str) -> str:
    payload = data.copy()
    payload["type"] = token_type
    payload["exp"] = _utcnow() + expires_delta
    payload["iat"] = _utcnow()
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_access_token(data: dict[str, Any]) -> str:
    """Create a short-lived JWT access token.

    Args:
        data: Claims to embed in the token (e.g. ``{"sub": user_id}``).

    Returns:
        Encoded JWT string.
    """
    delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _build_token(data, delta, _ACCESS)


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a long-lived JWT refresh token.

    Args:
        data: Claims to embed in the token (e.g. ``{"sub": user_id}``).

    Returns:
        Encoded JWT string.
    """
    delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _build_token(data, delta, _REFRESH)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token.

    Args:
        token: Raw JWT string.

    Returns:
        Decoded payload dictionary.

    Raises:
        :class:`jose.JWTError`: on any validation failure (expired, bad sig, …).
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
