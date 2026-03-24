from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from decimal import Decimal

class ServiceBase(BaseModel):
    service_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=5, max_length=200)
    price: Decimal = Field(..., ge=0, max_digits=10, decimal_places=2)
    duration_minutes: int = Field(..., ge=1)

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(ServiceBase):
    service_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=5, max_length=200)
    price: Optional[Decimal] = Field(..., ge=0, max_digits=10, decimal_places=2)
    duration_minutes: Optional[int] = Field(None, ge=1)
    
class ServiceRead(ServiceBase):
    id: int
    price: Decimal = Field(..., ge=0, max_digits=10, decimal_places=2)
    description: Optional[str] = Field(None, min_length=5, max_length=200)
    duration_minutes: int = Field(..., ge=1)
    is_active: bool
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class ServiceMinimalRead(BaseModel):
    id: int
    service_name: str
    price: Decimal = Field(..., ge=0, max_digits=10, decimal_places=2)

    model_config = ConfigDict(from_attributes=True)