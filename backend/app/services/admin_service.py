import asyncio
from typing import Optional, List
from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserResponse
from app.models.admin import ApprovalResponse, UserListResponse, AnalyticsOverview
from app.models.audit import AuditLog, insert_audit_log
from app.services.email_service import send_approval_email, send_rejection_email


async def get_pending_applications(db: AsyncIOMotorDatabase, role: str) -> List[UserResponse]:
    """Retrieve all pending applications for a specific role."""
    cursor = db["users"].find({"role": role, "status": "pending"}).sort("created_at", 1)
    users = await cursor.to_list(length=None)
    
    return [
        UserResponse(**{**user, "id": str(user["_id"])}) 
        for user in users
    ]


async def approve_user(db: AsyncIOMotorDatabase, user_id: str, admin_id: str) -> ApprovalResponse:
    """Approve a pending vet or seller."""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await db["users"].find_one_and_update(
        {"_id": obj_id, "status": "pending"},
        {"$set": {"status": "active"}},
        return_document=True
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Pending user not found or already processed"
        )

    # Log action
    log = AuditLog(
        admin_id=admin_id,
        action="approve",
        target_id=str(user["_id"]),
        target_role=user["role"]
    )
    await insert_audit_log(db, log)

    # Send email (running synchronously, but shouldn't block much if fast, 
    # ideally should be background task, but keeping it simple as requested)
    send_approval_email(user["email"], user.get("full_name", "User"))

    return ApprovalResponse(
        user_id=str(user["_id"]),
        name=user.get("full_name", "User"),
        email=user["email"],
        role=user["role"],
        status="active",
        message="User successfully approved."
    )


async def reject_user(db: AsyncIOMotorDatabase, user_id: str, admin_id: str, reason: str) -> ApprovalResponse:
    """Reject a pending vet or seller."""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await db["users"].find_one_and_update(
        {"_id": obj_id, "status": "pending"},
        {"$set": {"status": "rejected"}},
        return_document=True
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Pending user not found or already processed"
        )

    # Log action
    log = AuditLog(
        admin_id=admin_id,
        action="reject",
        target_id=str(user["_id"]),
        target_role=user["role"],
        reason=reason
    )
    await insert_audit_log(db, log)

    send_rejection_email(user["email"], user.get("full_name", "User"), reason)

    return ApprovalResponse(
        user_id=str(user["_id"]),
        name=user.get("full_name", "User"),
        email=user["email"],
        role=user["role"],
        status="rejected",
        message="User successfully rejected."
    )


async def get_users_paginated(
    db: AsyncIOMotorDatabase, 
    role: Optional[str], 
    search: Optional[str], 
    page: int, 
    limit: int
) -> UserListResponse:
    """Fetch paginated users with optional role and search filters."""
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    
    total_task = db["users"].count_documents(query)
    cursor = db["users"].find(query).skip(skip).limit(limit)
    items_task = cursor.to_list(length=limit)
    
    total, users = await asyncio.gather(total_task, items_task)

    pages = (total + limit - 1) // limit

    user_responses = [
        UserResponse(**{**user, "id": str(user["_id"])}) 
        for user in users
    ]

    return UserListResponse(
        items=user_responses,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )


async def deactivate_user(db: AsyncIOMotorDatabase, user_id: str, admin_id: str) -> UserResponse:
    """Deactivate an active user."""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await db["users"].find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": "deactivated"}},
        return_document=True
    )

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    log = AuditLog(
        admin_id=admin_id,
        action="deactivate",
        target_id=str(user["_id"]),
        target_role=user["role"]
    )
    await insert_audit_log(db, log)

    return UserResponse(**{**user, "id": str(user["_id"])})


async def reactivate_user(db: AsyncIOMotorDatabase, user_id: str, admin_id: str) -> UserResponse:
    """Reactivate a deactivated user."""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await db["users"].find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": "active"}},
        return_document=True
    )

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    log = AuditLog(
        admin_id=admin_id,
        action="reactivate",
        target_id=str(user["_id"]),
        target_role=user["role"]
    )
    await insert_audit_log(db, log)

    return UserResponse(**{**user, "id": str(user["_id"])})


async def get_analytics_overview(db: AsyncIOMotorDatabase) -> AnalyticsOverview:
    """Fetch parallel counts for all primary metrics."""
    tasks = [
        db["users"].count_documents({"role": "user"}),
        db["users"].count_documents({"role": "user", "status": "active"}),
        db["users"].count_documents({"role": "vet", "status": "pending"}),
        db["users"].count_documents({"role": "vet", "status": "active"}),
        db["users"].count_documents({"role": "seller", "status": "pending"}),
        db["users"].count_documents({"role": "seller", "status": "active"}),
        db["products"].count_documents({"is_active": True}),
        db["orders"].count_documents({})
    ]

    results = await asyncio.gather(*tasks)

    return AnalyticsOverview(
        total_users=results[0],
        active_users=results[1],
        pending_vets=results[2],
        active_vets=results[3],
        pending_sellers=results[4],
        active_sellers=results[5],
        total_products=results[6],
        total_orders=results[7]
    )
