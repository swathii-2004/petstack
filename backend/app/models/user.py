from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Annotated, Any

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ── Helpers ───────────────────────────────────────────────────────────────────


class PyObjectId(str):
    """Coerce a MongoDB ObjectId to/from a plain string."""

    @classmethod
    def __get_validators__(cls):  # pydantic v1 compatibility shim
        yield cls.validate

    @classmethod
    def validate(cls, value: Any) -> str:
        if isinstance(value, ObjectId):
            return str(value)
        if ObjectId.is_valid(value):
            return str(value)
        raise ValueError(f"Invalid ObjectId: {value!r}")

    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(cls.validate)


# ── Enums ─────────────────────────────────────────────────────────────────────


class UserRole(str, Enum):
    user = "user"
    vet = "vet"
    seller = "seller"
    admin = "admin"


class UserStatus(str, Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"
    deactivated = "deactivated"


# ── Request / Input schemas ────────────────────────────────────────────────────


class UserCreate(BaseModel):
    """Schema for the signup request body."""

    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.user

    @field_validator("role")
    @classmethod
    def only_user_role_allowed_at_signup(cls, v: UserRole) -> UserRole:
        """Phase-1 restriction: only the 'user' role may self-register."""
        if v != UserRole.user:
            raise ValueError("Only role='user' is permitted during signup.")
        return v


class UserLogin(BaseModel):
    """Schema for the login request body."""

    email: EmailStr
    password: str


# ── Response schemas ──────────────────────────────────────────────────────────


class UserResponse(BaseModel):
    """Safe public-facing user representation (no password hash)."""

    id: PyObjectId = Field(alias="_id")
    full_name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


# ── Internal / DB schema ──────────────────────────────────────────────────────


class UserInDB(BaseModel):
    """Full document as stored in MongoDB (includes hashed password)."""

    id: PyObjectId | None = Field(default=None, alias="_id")
    full_name: str
    email: EmailStr
    hashed_password: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}
