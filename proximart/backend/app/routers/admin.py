from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone
from bson import ObjectId
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.services.email_service import send_approval_email, send_rejection_email
from app.utils.encryption import decrypt
from app.routers.auth import format_user

router = APIRouter(prefix="/admin", tags=["admin"])

# Dependency that ensures the route is only accessed by an admin
# Note: require_role returns a dependency checker that itself depends on get_current_user
admin_required = Depends(require_role(["admin"]))

class RejectReason(BaseModel):
    reason: str
    model_config = ConfigDict(extra="forbid")

class StatusUpdate(BaseModel):
    status: str
    model_config = ConfigDict(extra="forbid")

async def log_admin_action(db, admin_id: ObjectId, action: str, target_id: ObjectId, details: str = ""):
    await db.admin_audit_log.insert_one({
        "admin_id": admin_id,
        "action": action,
        "target_id": target_id,
        "details": details,
        "timestamp": datetime.now(timezone.utc)
    })

@router.get("/pending", dependencies=[admin_required])
async def get_pending_approvals(role: str = "vendor", db = Depends(get_db)):
    if role != "vendor":
        raise HTTPException(status_code=400, detail="Only vendor pending approvals are supported currently")
        
    pending_users = await db.users.find({"role": role, "status": "pending"}).to_list(100)
    
    results = []
    for u in pending_users:
        profile = await db.vendor_profiles.find_one({"user_id": u["_id"]})
        if profile:
            profile["_id"] = str(profile["_id"])
            profile["user_id"] = str(profile["user_id"])
            if "gst_number" in profile:
                profile["gst_number"] = decrypt(profile["gst_number"])
        
        user_dict = u.copy()
        if "phone" in user_dict:
            user_dict["phone"] = decrypt(user_dict["phone"])
            
        results.append({
            "user": format_user(user_dict).model_dump(),
            "profile": profile
        })
        
    return results

@router.post("/approve/{user_id}")
async def approve_vendor(user_id: str, db = Depends(get_db), current_admin: dict = admin_required):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("status") != "pending":
        raise HTTPException(status_code=400, detail="User is not in pending status")
        
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": "active"}})
    await log_admin_action(db, current_admin["_id"], "APPROVE_VENDOR", ObjectId(user_id))
    
    send_approval_email(user["email"], user["name"])
    return {"message": "Vendor approved successfully"}

@router.post("/reject/{user_id}")
async def reject_vendor(user_id: str, payload: RejectReason, db = Depends(get_db), current_admin: dict = admin_required):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("status") != "pending":
        raise HTTPException(status_code=400, detail="User is not in pending status")
        
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": "rejected"}})
    await log_admin_action(db, current_admin["_id"], "REJECT_VENDOR", ObjectId(user_id), payload.reason)
    
    send_rejection_email(user["email"], user["name"], payload.reason)
    return {"message": "Vendor rejected successfully"}

@router.get("/users", dependencies=[admin_required])
async def get_all_users(db = Depends(get_db)):
    users = await db.users.find({"role": {"$ne": "admin"}}).to_list(500)
    results = []
    for u in users:
        u_dict = u.copy()
        if "phone" in u_dict:
            u_dict["phone"] = decrypt(u_dict["phone"])
        results.append(format_user(u_dict).model_dump())
    return results

@router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, payload: StatusUpdate, db = Depends(get_db), current_admin: dict = admin_required):
    valid_statuses = ["active", "inactive", "pending", "rejected"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": payload.status}})
    await log_admin_action(db, current_admin["_id"], f"STATUS_{payload.status.upper()}", ObjectId(user_id))
    
    return {"message": f"User status updated to {payload.status}"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db = Depends(get_db), current_admin: dict = admin_required):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Hard delete for simplicity
    await db.users.delete_one({"_id": ObjectId(user_id)})
    if user.get("role") == "vendor":
        await db.vendor_profiles.delete_one({"user_id": ObjectId(user_id)})
        
    await log_admin_action(db, current_admin["_id"], "DELETE_USER", ObjectId(user_id))
    return {"message": "User deleted successfully"}

@router.get("/analytics/overview", dependencies=[admin_required])
async def get_analytics_overview(db = Depends(get_db)):
    total_users = await db.users.count_documents({"role": "user"})
    active_vendors = await db.users.count_documents({"role": "vendor", "status": "active"})
    pending_approvals = await db.users.count_documents({"role": "vendor", "status": "pending"})
    
    return {
        "total_users": total_users,
        "active_vendors": active_vendors,
        "pending_approvals": pending_approvals
    }
