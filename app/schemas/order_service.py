from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

from .service import ServiceMinimalRead
from .vehicle import VehicleRead

class OrderServiceBase(BaseModel):
    client_id: int
    vehicle_id: int
    service_id: int
    washer_id:int
    casher_id:int
    delivery_time: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    start_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    completion_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    discount: Optional[float] = Field(0, ge=0, le=100)
    subtotal: Optional[float] = Field(0, ge=0)
    is_active: bool = True
    
class OrderServiceCreate(OrderServiceBase):
    pass

class OrderServiceUpdate(BaseModel):
    client_id: Optional[int] = Field(None)
    vehicle_id: Optional[int] = Field(None)
    service_id: Optional[int] = Field(None)
    washer_id: Optional[int] = Field(None)
    casher_id: Optional[int] = Field(None)
    delivery_time: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    start_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    completion_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    discount: Optional[float] = Field(0, ge=0, le=100)
    subtotal: Optional[float] = Field(0, ge=0)
    is_active: Optional[bool] = None

class OrderServiceRead(OrderServiceBase):
    id: int
    service: ServiceMinimalRead
    delivery_time: Optional[datetime] = None
    start_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    completion_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    discount: Optional[float] = Field(0, ge=0, le=100)
    subtotal: Optional[float] = Field(0, ge=0)
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class OrderServiceMinimalRead(BaseModel):
    id: int
    service: ServiceMinimalRead
    delivery_time: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    discount: Optional[float] = Field(0, ge=0, le=100)
    subtotal: Optional[float] = Field(0, ge=0)

    model_config = ConfigDict(from_attributes=True)