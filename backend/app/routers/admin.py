from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.user import UserRole, UserResponse
from app.models.admin import RejectRequest, ApprovalResponse, AnalyticsOverview, UserListResponse
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending", response_model=List[UserResponse])
async def get_pending_applications(
    role: str = Query(..., description="Role to filter pending apps (vet or seller)"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.admin]))
):
    """Get all pending applications for a given role."""
    return await admin_service.get_pending_applications(db, role)


@router.put("/approve/{user_id}", response_model=ApprovalResponse)
async def approve_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.admin]))
):
    """Approve a pending application and notify the user."""
    admin_id = str(current_user["_id"])
    return await admin_service.approve_user(db, user_id, admin_id)


@router.put("/reject/{user_id}", response_model=ApprovalResponse)
async def reject_user(
    user_id: str,
    request: RejectRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.admin]))
):
    """Reject a pending application, record the reason, and notify the user."""
    admin_id = str(current_user["_id"])
    return await admin_service.reject_user(db, user_id, admin_id, request.reason)


@router.get("/users", response_model=UserListResponse)
async def get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.admin]))
):
    """List and filter users with pagination."""
    return await admin_service.get_users_paginated(db, role, search, page, limit)


@router.put("/users/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.admin]))
):
    """Deactivate a user account."""
    admin_id = str(current_user["_id"])
    return await admin_service.deactivate_user(db, user_id, admin_id)


@router.put("/users/{user_id}/reactivate", response_model=UserResponse)
async def reactivate_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.admin]))
):
    """Reactivate a deactivated user account."""
    admin_id = str(current_user["_id"])
    return await admin_service.reactivate_user(db, user_id, admin_id)


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role([UserRole.admin]))
):
    """Get high-level analytics counts for the admin dashboard."""
    return await admin_service.get_analytics_overview(db)
