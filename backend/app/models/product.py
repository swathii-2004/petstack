from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.user import PyObjectId


# ── Product ────────────────────────────────────────────────────────────────────

CATEGORIES = ["food", "grooming", "clothing", "accessories", "other"]


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(..., description="One of: food, grooming, clothing, accessories, other")
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)
    low_stock_threshold: int = Field(5, ge=0)
    tags: list[str] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    tags: Optional[list[str]] = None


class ProductResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    seller_id: str
    name: str
    description: str
    category: str
    price: float
    stock: int
    low_stock_threshold: int
    is_low_stock: bool = False
    image_urls: list[str] = []
    tags: list[str] = []
    is_active: bool
    rating: float = 0.0
    review_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class PaginatedProducts(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    pages: int


# ── Seller Profile ─────────────────────────────────────────────────────────────


class SellerProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    phone: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_name: Optional[str] = None


class SellerProfileResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    seller_id: str
    business_name: Optional[str] = None
    phone: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_name: Optional[str] = None
    updated_at: datetime

    model_config = {"populate_by_name": True}


# ── Review ─────────────────────────────────────────────────────────────────────


class ReviewResponse(BaseModel):
    id: PyObjectId = Field(validation_alias="_id", default="")
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime

    model_config = {"populate_by_name": True}
