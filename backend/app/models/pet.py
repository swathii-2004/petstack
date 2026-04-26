from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class PetCreate(BaseModel):
    name: str = Field(..., min_length=1)
    species: str
    breed: Optional[str] = None
    dob: Optional[str] = None  # YYYY-MM-DD
    weight: Optional[float] = None
    photo_url: Optional[str] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    dob: Optional[str] = None
    weight: Optional[float] = None
    photo_url: Optional[str] = None


class PetResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    user_id: str
    name: str
    species: str
    breed: Optional[str] = None
    dob: Optional[str] = None
    weight: Optional[float] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}
