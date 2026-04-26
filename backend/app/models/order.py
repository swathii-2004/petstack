from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class OrderItem(BaseModel):
    product_id: str
    seller_id: str
    name: str
    price: float
    quantity: int = Field(..., gt=0)
    image_url: Optional[str] = None


class OrderCreate(BaseModel):
    items: list[OrderItem]
    delivery_address: str
    payment_method: str = "razorpay"


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None


class OrderResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    user_id: str
    items: list[OrderItem]
    total_amount: float
    delivery_address: str
    payment_method: str = "razorpay"
    status: str  # placed, confirmed, processing, shipped, delivered, cancelled, refunded
    tracking_number: Optional[str] = None
    stripe_session_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class PaginatedOrders(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    pages: int
