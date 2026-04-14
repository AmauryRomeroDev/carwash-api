# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    last_name: str = Field(..., min_length=2, max_length=60)
    second_last_name: Optional[str] = Field(None, min_length=2, max_length=60)
    phone: str = Field(..., pattern=r"^\+?\d{10,15}$")
    photo_url: Optional[str] = None 
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6, max_length=255)
    type: Optional[str] = "client"
    
class UserCreate(UserBase):
    pass

class UserUpdate(UserBase):
    name: Optional[str] = None
    last_name: Optional[str] = None 
    second_last_name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None 
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserRead(UserBase):
    id: int
    name: str
    last_name: str
    second_last_name: Optional[str]
    phone: Optional[str]
    email: Optional[EmailStr]
    is_active: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)
    
class UserMinimalRead(BaseModel):
    id: int
    name: str
    last_name: str
    second_last_name: Optional[str]
    phone: Optional[str] = None 
    photo_url: Optional[str] = None 
    email: Optional[EmailStr]

    model_config = ConfigDict(from_attributes=True)