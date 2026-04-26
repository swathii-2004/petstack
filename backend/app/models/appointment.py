from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class AppointmentBook(BaseModel):
    vet_id: str
    pet_id: str
    date: str  # YYYY-MM-DD
    time_slot: str  # HH:MM
    reason: str


class AppointmentStatusUpdate(BaseModel):
    status: str  # accepted, rejected, completed, cancelled
    vet_note: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    vet_id: str
    user_id: str
    pet_id: str
    date: str
    time_slot: str
    reason: str
    status: str  # pending, accepted, completed, rejected, cancelled
    vet_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class PaginatedAppointments(BaseModel):
    items: list[AppointmentResponse]
    total: int
    page: int
    pages: int
