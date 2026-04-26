from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.user import UserResponse


class RejectRequest(BaseModel):
    reason: str = Field(..., min_length=10, description="Reason for rejection")


class ApprovalResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    status: str
    message: str


class AnalyticsOverview(BaseModel):
    total_users: int
    active_users: int
    pending_vets: int
    active_vets: int
    pending_sellers: int
    active_sellers: int
    total_products: int
    total_orders: int
    total_revenue: float


class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    limit: int
    pages: int
