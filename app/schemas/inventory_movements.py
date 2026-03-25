from pydantic import BaseModel,EmailStr, Field, ConfigDict,field_validator
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

from .product import ProductMinimalRead
from .employee import EmployeeMinimalRead

class MovementType(str,Enum):
    IN = "in"
    OUT = "out"

class InventoryMovementBase(BaseModel):
    product_id: int
    type: MovementType
    amount: int
    order_id:Optional[int] = Field(None) 
    employee_id: int
    note: Optional[str] = Field(None, max_length=200)
    
class InventoryMovementCreate(InventoryMovementBase):
    pass

class InventoryMovementUpdate(InventoryMovementBase):
    type: MovementType
    amount:int
    note: Optional[str]=Field(..., min_length=10, max_length=200)

class InventoryMovementRead(InventoryMovementBase):
    id: int
    type: MovementType
    product: ProductMinimalRead
    amount: int
    order_id: Optional[int] = Field(None) 
    employee: EmployeeMinimalRead
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    @field_validator('type', mode='before')
    @classmethod
    def transform_enum_to_string(cls, v):
    # Si viene como objeto Enum <MovementType.IN: 'IN'>, extraemos 'in'
        if hasattr(v, 'value'):
            return v.value.lower()
        return str(v).lower()
    
class InventoryMovementMinimalRead(InventoryMovementBase):
    id: int
    type: MovementType
    product: ProductMinimalRead
    amount: int
    employee: EmployeeMinimalRead
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('type', mode='before')
    @classmethod
    def transform_enum_to_string(cls, v):
    # Si viene como objeto Enum <MovementType.IN: 'IN'>, extraemos 'in'
        if hasattr(v, 'value'):
            return v.value.lower()
        return str(v).lower()