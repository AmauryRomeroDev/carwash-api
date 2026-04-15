from pydantic import BaseModel,EmailStr, Field, ConfigDict, AliasChoices, AliasPath
from typing import Optional, List
from datetime import datetime, timezone


from .service import ServiceMinimalRead
from .vehicle import VehicleRead
from .client import ClientMinimalRead

class OrderServiceBase(BaseModel):
    ticket_id: int
    client_id: int
    vehicle_id: int
    service_id: int
    washer_id:int
    casher_id:int
    delivery_time: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    start_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    completion_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    subtotal: Optional[float] = Field(0, ge=0)
    is_active: bool = True
    
class OrderServiceCreate(OrderServiceBase):
    pass

class OrderServiceUpdate(BaseModel):
    ticket_id: Optional[int]= Field(None)
    client_id: Optional[int] = Field(None)
    vehicle_id: Optional[int] = Field(None)
    service_id: Optional[int] = Field(None)
    washer_id: Optional[int] = Field(None)
    casher_id: Optional[int] = Field(None)
    delivery_time: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=50)
    start_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    completion_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    subtotal: Optional[float] = Field(0, ge=0)
    is_active: Optional[bool] = None

class OrderServiceRead(OrderServiceBase):
    id: int
    ticket_id: Optional[int]
    washer_id: Optional[int] = Field(None)
    casher_id: Optional[int] = Field(None)
    service: ServiceMinimalRead
    client:Optional[ClientMinimalRead]
    vehicle: Optional[VehicleRead]
    delivery_time: Optional[datetime] = None
    notes: Optional[str]
    start_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    completion_time: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))
    subtotal: Optional[float] = Field(0, ge=0)
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class OrderServiceMinimalRead(BaseModel):
    id: int
    ticket_id: Optional[int]= Field(None)
    washer_id: Optional[int] = Field(None)
    casher_id: Optional[int] = Field(None)
    service: ServiceMinimalRead
    delivery_time: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    subtotal: Optional[float] = Field(0, ge=0)

    model_config = ConfigDict(from_attributes=True)
    
# Tickets ---------------------
class ServiceTicketItem(BaseModel):
    service_name: str = Field(
        validation_alias=AliasChoices('service_name', AliasPath('service', 'service_name'))
    )
    price_base: float = Field(
        validation_alias=AliasChoices('price_base', AliasPath('service', 'price'))
    )
    discount: float = Field(
        validation_alias=AliasChoices(AliasPath('service', 'discount'), 'discount'),
        default=0.0
    )
    total: float = Field(
        validation_alias=AliasChoices('total', 'subtotal')
    )

    model_config = ConfigDict(from_attributes=True)


class ServiceTicketResponse(BaseModel):
    casher_name: str
    client_name: str
    created_at: datetime
    items: List[ServiceTicketItem]
    grand_total: float
    model_config = ConfigDict(from_attributes=True)
