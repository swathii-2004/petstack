from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class DayAvailability(BaseModel):
    is_working: bool = True
    start_time: str = "09:00"  # HH:MM
    end_time: str = "17:00"


class WeeklySchedule(BaseModel):
    monday: DayAvailability = DayAvailability()
    tuesday: DayAvailability = DayAvailability()
    wednesday: DayAvailability = DayAvailability()
    thursday: DayAvailability = DayAvailability()
    friday: DayAvailability = DayAvailability()
    saturday: DayAvailability = DayAvailability(is_working=False)
    sunday: DayAvailability = DayAvailability(is_working=False)


class VetAvailabilityUpdate(BaseModel):
    schedule: WeeklySchedule
    blocked_dates: list[str] = []  # ["YYYY-MM-DD"]
    slot_duration_minutes: int = 30


class VetAvailabilityResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    vet_id: str
    schedule: WeeklySchedule
    blocked_dates: list[str]
    slot_duration_minutes: int
    updated_at: datetime

    model_config = {"populate_by_name": True}


class VetReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1)


class VetReviewResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    vet_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime

    model_config = {"populate_by_name": True}
