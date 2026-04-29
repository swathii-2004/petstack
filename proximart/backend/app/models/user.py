from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional

class UserSignupUser(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str
    
    model_config = ConfigDict(extra="forbid")

class UserSignupVendor(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str
    store_name: str
    gst_number: str
    city: str
    
    model_config = ConfigDict(extra="forbid")

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
    model_config = ConfigDict(extra="forbid")

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    status: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    
    model_config = ConfigDict(extra="forbid")
