from pydantic import BaseModel,EmailStr, Field, ConfigDict
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
    reference_id:int
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
    employee: EmployeeMinimalRead
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class InventoryMovementMinimalRead(InventoryMovementBase):
    id: int
    type: MovementType
    product: ProductMinimalRead
    amount: int
    employee: EmployeeMinimalRead