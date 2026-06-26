from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional
from bson import ObjectId

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.dependencies import get_current_user, require_role, require_active
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
    current_user: dict = Depends(require_active([UserRole.seller])),
):
    return await product_service.get_seller_profile(db, str(current_user["_id"]))


@router.put("/sellers/me/profile", response_model=SellerProfileResponse)
async def update_my_profile(
    payload: SellerProfileUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_active([UserRole.seller])),
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
    current_user: dict = Depends(require_active([UserRole.seller])),
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
    current_user: dict = Depends(require_active([UserRole.seller])),
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
    current_user: dict = Depends(require_active([UserRole.seller])),
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
    current_user: dict = Depends(require_active([UserRole.seller])),
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


# ── Reviews ────────────────────────────────────────────────────────

@router.get("/reviews/product/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(
    product_id: str,
    page: int = Query(1, ge=1),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await product_service.get_reviews_for_product(db, product_id, page)


@router.get("/reviews/product/{product_id}/eligibility")
async def check_product_review_eligibility(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    role = current_user.get("role")
    if role != UserRole.user.value:
        return {"eligible": False}
        
    order = await db.orders.find_one({
        "user_id": str(current_user["_id"]),
        "items.product_id": product_id,
        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
    })
    
    already_reviewed = await db.reviews.find_one({
        "user_id": str(current_user["_id"]),
        "product_id": product_id
    })
    
    return {"eligible": order is not None and already_reviewed is None}


@router.post("/reviews/product/{product_id}", response_model=ReviewResponse)
async def create_product_review(
    product_id: str,
    rating: int = Form(...),
    comment: str = Form(...),
    images: List[UploadFile] = File(default=[]),
    current_user: dict = Depends(require_role([UserRole.user])),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # 1. Verify user purchased the product
    order = await db.orders.find_one({
        "user_id": str(current_user["_id"]),
        "items.product_id": product_id,
        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
    })
    if not order:
        raise HTTPException(
            status_code=400,
            detail="You can only review products you have purchased."
        )
        
    # 2. Check if product exists
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # 3. Limit to max 2 images
    valid_images = [img for img in images if img.filename]
    if len(valid_images) > 2:
        raise HTTPException(
            status_code=400,
            detail="Maximum 2 images allowed for product reviews."
        )
        
    # 4. Upload images
    image_urls = []
    if valid_images:
        image_urls = await upload_images(valid_images, folder="petstack/reviews")
        
    # 5. Save review
    review_doc = {
        "product_id": product_id,
        "user_id": str(current_user["_id"]),
        "user_name": current_user.get("full_name") or current_user.get("name") or "Pet Parent",
        "rating": rating,
        "comment": comment,
        "image_urls": image_urls,
        "created_at": datetime.utcnow()
    }
    
    result = await db.reviews.insert_one(review_doc)
    review_doc["_id"] = str(result.inserted_id)
    
    # 6. Recalculate average rating & count
    cursor = db.reviews.find({"product_id": product_id})
    all_reviews = await cursor.to_list(length=1000)
    total_rating = sum(r["rating"] for r in all_reviews)
    count = len(all_reviews)
    avg_rating = round(total_rating / count, 1) if count > 0 else 0.0
    
    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"rating": avg_rating, "review_count": count}}
    )
    
    return ReviewResponse(**review_doc)


@router.get("/reviews/seller", response_model=List[ReviewResponse])
async def get_seller_product_reviews(
    current_user: dict = Depends(require_active([UserRole.seller])),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    seller_id = str(current_user["_id"])
    
    # 1. Find all products for this seller
    cursor = db.products.find({"seller_id": seller_id})
    products = await cursor.to_list(length=1000)
    
    # Create product mapping for quick lookups
    product_map = {}
    for p in products:
        p_id = str(p["_id"])
        product_map[p_id] = {
            "name": p.get("name"),
            "image": p.get("image_urls")[0] if p.get("image_urls") else None
        }
        
    product_ids = list(product_map.keys())
    if not product_ids:
        return []
        
    # 2. Find all reviews for these products
    cursor = db.reviews.find({"product_id": {"$in": product_ids}}).sort("created_at", -1)
    reviews = await cursor.to_list(length=1000)
    
    # 3. Construct response with product details
    result = []
    for r in reviews:
        r["_id"] = str(r["_id"])
        p_id = r.get("product_id")
        p_info = product_map.get(p_id, {})
        r["product_name"] = p_info.get("name")
        r["product_image"] = p_info.get("image")
        result.append(ReviewResponse(**r))
        
    return result
