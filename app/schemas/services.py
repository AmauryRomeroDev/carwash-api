from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

class ServiceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=5, max_length=200)
    price: float = Field(..., ge=0)
    duration: int = Field(..., ge=1)

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(ServiceBase):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=5, max_length=200)
    price: Optional[float] = Field(None, ge=0)
    duration: Optional[int] = Field(None, ge=1)
    
class ServiceRead(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class ServiceMinimalRead(BaseModel):
    id: int
    name: str
    price: float

    model_config = ConfigDict(from_attributes=True)