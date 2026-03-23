from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List,TYPE_CHECKING
from datetime import datetime, timezone

if TYPE_CHECKING:
    from .client import ClientMinimalRead

class VehicleBase(BaseModel):
    license_plate: str = Field(...,min_length=1, max_length=20)
    brand: str = Field(...,min_length=1, max_length=50)
    model: str = Field(...,min_length=1, max_length=50)
    color: Optional[str] = Field(None, min_length=1, max_length=30)
    client_id: Optional[int]=None
    
class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    license_plate: Optional[str] = Field(None, min_length=1, max_length=20)
    brand: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, min_length=1, max_length=30)
    
class VehicleRead(VehicleBase):
    id: int
    brand: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, min_length=1, max_length=30)
    client: Optional['ClientMinimalRead']=None
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class VehicleMinimalRead(VehicleBase):
    id: int
    client: Optional['ClientMinimalRead']=None
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    

