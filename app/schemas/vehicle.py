from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List,TYPE_CHECKING
from datetime import datetime, timezone

if TYPE_CHECKING:
    from .client import ClientMinimalRead

class VehicleBase(BaseModel):
    liscence_plate: str = Field(...,min_length=10, max_length=20)
    brand: str = Field(...,min_length=3, max_length=50)
    model: str = Field(...,min_length=3, max_length=50)
    color: Optional[str] = Field(None, min_length=1, max_length=30)
    vehicle_type:str=Field(...,min_length=5, max_length=30)
    client_id: Optional[int]=None
    
class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    liscence_plate: Optional[str] = Field(None, min_length=17, max_length=20)
    brand: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, min_length=1, max_length=30)
    vehcicle_type:Optional[str]= Field(None, min_length=1, max_length=30)
    
    
class VehicleRead(VehicleBase):
    id: int
    brand: Optional[str] = Field(None, min_length=3, max_length=50)
    model: Optional[str] = Field(None, min_length=3, max_length=50)
    color: Optional[str] = Field(None, min_length=3, max_length=30)
    vehicle_type: Optional[str]= Field(None, min_length=3, max_length=30)
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
    

