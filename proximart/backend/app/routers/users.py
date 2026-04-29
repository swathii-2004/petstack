from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
from app.models.user import UserResponse
from app.dependencies import get_current_user
from app.utils.encryption import decrypt, encrypt
from app.database import get_db
from app.routers.auth import format_user

router = APIRouter(prefix="/users", tags=["users"])

class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_copy = current_user.copy()
    user_copy["phone"] = decrypt(user_copy.get("phone"))
    return format_user(user_copy)

@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    update_fields = {}
    if update_data.name is not None:
        update_fields["name"] = update_data.name
    if update_data.phone is not None:
        update_fields["phone"] = encrypt(update_data.phone)
    if update_data.avatar_url is not None:
        update_fields["avatar_url"] = update_data.avatar_url
        
    if update_fields:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_fields}
        )
        current_user.update(update_fields)
        
    user_copy = current_user.copy()
    user_copy["phone"] = decrypt(user_copy.get("phone"))
    return format_user(user_copy)
