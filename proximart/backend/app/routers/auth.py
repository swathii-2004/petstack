from fastapi import APIRouter, Depends, HTTPException, Request, Response
from datetime import timedelta
from pydantic import ValidationError
from app.database import get_db
from app.models.user import UserSignupUser, UserSignupVendor, UserLogin, TokenResponse, UserResponse
from app.services import auth_service
from app.utils.jwt import encode_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])

def format_user(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        status=user["status"],
        phone=user.get("phone"),
        avatar_url=user.get("avatar_url")
    )

def set_tokens(response: Response, user: dict) -> TokenResponse:
    user_id = str(user["_id"])
    role = user["role"]
    
    access_token = encode_token(
        payload={"user_id": user_id, "role": role},
        expires_delta=timedelta(minutes=15)
    )
    
    refresh_token = encode_token(
        payload={"user_id": user_id},
        expires_delta=timedelta(days=7)
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=format_user(user)
    )

@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(request: Request, response: Response, db = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
        if data.get("role") != "user":
            raise HTTPException(status_code=400, detail="role must be 'user' for JSON signup")
        # Remove role from data so it doesn't fail strict validation for UserSignupUser
        data.pop("role", None)
        try:
            user_data = UserSignupUser(**data)
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=e.errors())
        user = await auth_service.signup_user(user_data, db)
        
    elif "multipart/form-data" in content_type:
        form = await request.form()
        if form.get("role") != "vendor":
            raise HTTPException(status_code=400, detail="role must be 'vendor' for multipart signup")
        try:
            vendor_data = UserSignupVendor(
                name=form.get("name"),
                email=form.get("email"),
                password=form.get("password"),
                phone=form.get("phone"),
                store_name=form.get("store_name"),
                gst_number=form.get("gst_number"),
                city=form.get("city")
            )
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=e.errors())
        
        files = form.getlist("files")
        if not files:
            raise HTTPException(status_code=400, detail="files are required")
            
        user = await auth_service.signup_vendor(vendor_data, files, db)
    else:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    return set_tokens(response, user)

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, response: Response, db = Depends(get_db)):
    user = await auth_service.login(data, db)
    return set_tokens(response, user)

@router.post("/refresh")
async def refresh(request: Request, response: Response, db = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    payload = decode_token(refresh_token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("status") != "active":
        raise HTTPException(status_code=401, detail="User inactive or not found")
        
    access_token = encode_token(
        payload={"user_id": str(user["_id"]), "role": user["role"]},
        expires_delta=timedelta(minutes=15)
    )
    
    return {"access_token": access_token}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
