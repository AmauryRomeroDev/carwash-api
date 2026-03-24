from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

from .employee import EmployeeMinimalRead
from .product import ProductMinimalRead

class OrderProductBase(BaseModel):
    product_id: int
    casher_id:int
    amount: int
    total:float
    discount: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    subtotal:float
    
class OrderProductCreate(OrderProductBase):
    pass

class OrderProductUpdate(OrderProductBase):
    amount: int
    total:float
    discount: Optional[float] = Field(..., ge=0.0, le=100.0)
    subtotal:float
    
class OrderProductRead(OrderProductBase):
    product: ProductMinimalRead
    casher:EmployeeMinimalRead
    amount: int
    total:float
    discount: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class OrderProductMinimalRead(OrderProductBase):
    product: ProductMinimalRead
    casher:EmployeeMinimalRead
    amount: int
    total:float
    discount: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    
    model_config= ConfigDict(from_attributes=True)