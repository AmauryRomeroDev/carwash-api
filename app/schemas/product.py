from pydantic import BaseModel,EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

class ProductBase(BaseModel):
    product_name: str = Field(...,min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    unit_price: float = Field(..., gt=0)
    stock:int
    discount:int
    has_discount:bool

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    unit_price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    has_discount:Optional[bool]
    discount:Optional[int]
    
class ProductRead(ProductBase):
    id:int
    product_name: str
    description: Optional[str]
    unit_price: float
    stock: int
    discount:int
    is_active: bool
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class ProductMinimalRead(ProductBase):
    id:int
    product_name:str
    unit_price: float
    stock: int
    discount:int
    is_active:bool
    
    model_config = ConfigDict(from_attributes=True)