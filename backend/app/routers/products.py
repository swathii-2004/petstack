from __future__ import annotations

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.product import (
    PaginatedProducts,
    ProductResponse,
    ProductUpdate,
    ReviewResponse,
    SellerProfileResponse,
    SellerProfileUpdate,
    ProductCreate,
)
from app.models.user import UserRole
from app.services import product_service
from app.utils.cloudinary_upload import upload_images

router = APIRouter(tags=["Products & Sellers"])


# ── Seller profile ──────────────────────────────────────────────────────────────

@router.get("/sellers/me/profile", response_model=SellerProfileResponse)
async def get_my_profile(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.seller])),
):
    return await product_service.get_seller_profile(db, str(current_user["_id"]))


@router.put("/sellers/me/profile", response_model=SellerProfileResponse)
async def update_my_profile(
    payload: SellerProfileUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.seller])),
):
    return await product_service.update_seller_profile(db, str(current_user["_id"]), payload)


# ── Product CRUD (seller) ──────────────────────────────────────────────────────

@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    low_stock_threshold: int = Form(5),
    tags: str = Form("[]"),  # JSON array string
    images: List[UploadFile] = File(default=[]),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.seller])),
):
    try:
        tags_list = json.loads(tags)
    except Exception:
        tags_list = []

    payload = ProductCreate(
        name=name,
        description=description,
        category=category,
        price=price,
        stock=stock,
        low_stock_threshold=low_stock_threshold,
        tags=tags_list,
    )
    valid_images = [f for f in images if f.filename]
    image_urls = await upload_images(valid_images) if valid_images else []
    return await product_service.create_product(db, str(current_user["_id"]), payload, image_urls)


@router.get("/products/mine", response_model=PaginatedProducts)
async def get_my_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.seller])),
):
    return await product_service.get_seller_products(db, str(current_user["_id"]), page, limit)


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    stock: Optional[int] = Form(None),
    low_stock_threshold: Optional[int] = Form(None),
    tags: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.seller])),
):
    try:
        tags_list = json.loads(tags) if tags else None
    except Exception:
        tags_list = None

    payload = ProductUpdate(
        name=name,
        description=description,
        category=category,
        price=price,
        stock=stock,
        low_stock_threshold=low_stock_threshold,
        tags=tags_list,
    )
    valid_images = [f for f in images if f.filename]
    new_urls = await upload_images(valid_images) if valid_images else None
    return await product_service.update_product(
        db, product_id, str(current_user["_id"]), payload, new_urls
    )


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.seller])),
):
    return await product_service.delete_product(db, product_id, str(current_user["_id"]))


# ── Public product endpoints ────────────────────────────────────────────────────

@router.get("/products", response_model=PaginatedProducts)
async def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await product_service.get_products_public(
        db, category, search, min_price, max_price, sort, page, limit
    )


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await product_service.get_product_by_id(db, product_id)


# ── Reviews (read-only) ────────────────────────────────────────────────────────

@router.get("/reviews/product/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(
    product_id: str,
    page: int = Query(1, ge=1),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await product_service.get_reviews_for_product(db, product_id, page)
