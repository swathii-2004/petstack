from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.product import (
    PaginatedProducts,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    ReviewResponse,
    SellerProfileResponse,
    SellerProfileUpdate,
)


# ── Helpers ────────────────────────────────────────────────────────────────────


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_response(doc: dict[str, Any]) -> ProductResponse:
    doc["_id"] = str(doc["_id"])
    doc["is_low_stock"] = doc.get("stock", 0) < doc.get("low_stock_threshold", 5)
    return ProductResponse(**doc)


async def ensure_product_index(db: AsyncIOMotorDatabase) -> None:
    """Create a text index on name + description + tags for full-text search."""
    await db["products"].create_index(
        [("name", "text"), ("description", "text"), ("tags", "text")],
        name="product_text_search",
    )


# ── Seller profile ─────────────────────────────────────────────────────────────


async def get_seller_profile(db: AsyncIOMotorDatabase, seller_id: str) -> SellerProfileResponse:
    doc = await db["seller_profiles"].find_one({"seller_id": seller_id})
    if not doc:
        # Return empty profile — auto-created on first PUT
        now = _now()
        doc = {
            "_id": ObjectId(),
            "seller_id": seller_id,
            "updated_at": now,
        }
    doc["_id"] = str(doc["_id"])
    return SellerProfileResponse(**doc)


async def update_seller_profile(
    db: AsyncIOMotorDatabase, seller_id: str, payload: SellerProfileUpdate
) -> SellerProfileResponse:
    update_data: dict[str, Any] = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = _now()

    doc = await db["seller_profiles"].find_one_and_update(
        {"seller_id": seller_id},
        {"$set": update_data},
        upsert=True,
        return_document=True,
    )
    doc["_id"] = str(doc["_id"])
    return SellerProfileResponse(**doc)


# ── Product CRUD ───────────────────────────────────────────────────────────────


async def create_product(
    db: AsyncIOMotorDatabase,
    seller_id: str,
    payload: ProductCreate,
    image_urls: list[str],
) -> ProductResponse:
    now = _now()
    doc = {
        **payload.model_dump(),
        "seller_id": seller_id,
        "image_urls": image_urls,
        "is_active": True,
        "rating": 0.0,
        "review_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["products"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_response(doc)


async def get_seller_products(
    db: AsyncIOMotorDatabase, seller_id: str, page: int = 1, limit: int = 20
) -> PaginatedProducts:
    query = {"seller_id": seller_id, "is_active": True}
    skip = (page - 1) * limit

    total_coro = db["products"].count_documents(query)
    items_coro = db["products"].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total, items = await asyncio.gather(total_coro, items_coro)

    pages = max(1, (total + limit - 1) // limit)
    return PaginatedProducts(
        items=[_to_response(doc) for doc in items],
        total=total,
        page=page,
        pages=pages,
    )


async def get_product_by_id(db: AsyncIOMotorDatabase, product_id: str) -> ProductResponse:
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID.")

    doc = await db["products"].find_one({"_id": oid, "is_active": True})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return _to_response(doc)


async def get_products_public(
    db: AsyncIOMotorDatabase,
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "newest",
    page: int = 1,
    limit: int = 20,
) -> PaginatedProducts:
    query: dict[str, Any] = {"is_active": True}

    if category and category != "all":
        query["category"] = category
    if search:
        query["$text"] = {"$search": search}
    if min_price is not None:
        query.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price

    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "rating": [("rating", -1)],
    }
    sort_order = sort_map.get(sort, [("created_at", -1)])
    skip = (page - 1) * limit

    total_coro = db["products"].count_documents(query)
    items_coro = db["products"].find(query).sort(sort_order).skip(skip).limit(limit).to_list(limit)
    total, items = await asyncio.gather(total_coro, items_coro)

    pages = max(1, (total + limit - 1) // limit)
    return PaginatedProducts(
        items=[_to_response(doc) for doc in items],
        total=total,
        page=page,
        pages=pages,
    )


async def update_product(
    db: AsyncIOMotorDatabase,
    product_id: str,
    seller_id: str,
    payload: ProductUpdate,
    new_image_urls: Optional[list[str]] = None,
) -> ProductResponse:
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID.")

    update_data: dict[str, Any] = {k: v for k, v in payload.model_dump().items() if v is not None}
    if new_image_urls:
        update_data["image_urls"] = new_image_urls
    update_data["updated_at"] = _now()

    doc = await db["products"].find_one_and_update(
        {"_id": oid, "seller_id": seller_id, "is_active": True},
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you do not own it.",
        )
    return _to_response(doc)


async def delete_product(db: AsyncIOMotorDatabase, product_id: str, seller_id: str) -> dict[str, str]:
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID.")

    result = await db["products"].update_one(
        {"_id": oid, "seller_id": seller_id, "is_active": True},
        {"$set": {"is_active": False, "updated_at": _now()}},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you do not own it.",
        )
    return {"message": "Product deleted successfully."}


# ── Reviews ────────────────────────────────────────────────────────────────────


async def get_reviews_for_product(
    db: AsyncIOMotorDatabase, product_id: str, page: int = 1, limit: int = 20
) -> list[ReviewResponse]:
    query = {"product_id": product_id}
    skip = (page - 1) * limit
    docs = (
        await db["reviews"]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    result = []
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        result.append(ReviewResponse(**doc))
    return result
