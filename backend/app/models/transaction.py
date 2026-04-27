from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class TransactionCreate(BaseModel):
    order_id: str
    amount: float
    status: str


class TransactionResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    order_id: str
    amount: float
    status: str
    created_at: datetime

    model_config = {"populate_by_name": True}
