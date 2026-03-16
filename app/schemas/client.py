from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

from .vehicle import VehicleMinimalRead
from .user import UserMinimalBase

class ClientBase(UserMinimalBase):
    address: Optional[str]= Field(...,min_length=5, max_length=100)
    

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    name: Optional[str] = Field(...,min_length=2, max_length=60)
    last_name: Optional[str]= Field(...,min_length=2, max_length=60)
    email: Optional[EmailStr] = None
    phone: Optional[str]= Field(..., pattern=r"^\+?\d{10,15}$")


class ClientRead(ClientBase):
    id: int
    name: str
    email: Optional[EmailStr]
    phone: str
    is_active: bool
    vehicles: List[VehicleMinimalRead]=[]
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class ClientMinimalRead(ClientBase):
    id: int
    name: str
    last_name: str
    email: Optional[EmailStr]
    phone: str

    model_config = ConfigDict(from_attributes=True)