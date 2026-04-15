# app/schemas/service.py
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional
from datetime import datetime, timezone
from decimal import Decimal

class ServiceBase(BaseModel):
    service_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=200)
    price: Decimal = Field(..., ge=0, max_digits=10, decimal_places=2)
    duration_minutes: int = Field(..., ge=1)
    discount: int = Field(0, ge=0)
    has_discount: bool = False

class ServiceCreate(ServiceBase):
    """Esquema para crear un servicio."""
    
    @model_validator(mode='after')
    def validate_discount(self) -> 'ServiceCreate':
        """Validar que el descuento no sea mayor que el precio."""
        if self.has_discount and self.discount > self.price:
            raise ValueError('El descuento no puede ser mayor que el precio')
        return self

class ServiceUpdate(BaseModel):
    """Esquema para actualizar un servicio."""
    service_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=200)
    price: Optional[Decimal] = Field(None, ge=0, max_digits=10, decimal_places=2)
    duration_minutes: Optional[int] = Field(None, ge=1)
    discount: Optional[int] = Field(None, ge=0)
    has_discount: Optional[bool] = None
    is_active: Optional[bool] = None
    
class ServiceRead(ServiceBase):
    """Esquema para leer un servicio."""
    id: int
    total: Decimal
    is_active: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    
class ServiceMinimalRead(BaseModel):
    """Esquema mínimo para listas."""
    id: int
    service_name: str
    price: Decimal
    discount: int

    model_config = ConfigDict(from_attributes=True)