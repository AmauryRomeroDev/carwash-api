from pydantic import BaseModel,EmailStr, Field, ConfigDict, AliasPath,AliasChoices
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
    
# Tickets --------------------------
# app/schemas/order_product.py

class TicketItemRead(BaseModel):
    product_name: str = Field(
        validation_alias=AliasChoices('product_name', AliasPath('product', 'product_name'))
    )
    # Intentará leer 'unit_price' (manual) o 'product.unit_price' (DB)
    unit_price: float = Field(
        validation_alias=AliasChoices('unit_price', AliasPath('product', 'unit_price'))
    )
    amount: int
    discount: float
    subtotal: float # Precio pza * Cantidad
    total: float    # Subtotal - Descuento

class TicketResponse(BaseModel):
    ticket_id: int
    casher_name: str
    created_at: datetime
    items: List[TicketItemRead]
    grand_total: float

    model_config = ConfigDict(from_attributes=True)
