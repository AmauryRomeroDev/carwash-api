# app/schemas/employee.py
from pydantic import BaseModel, Field, ConfigDict, field_validator, AliasPath
from typing import Optional, List
from datetime import datetime
from .user import UserBase

DIAS_LABORALES = [
    {"value": 0, "label": "Domingo"},
    {"value": 1, "label": "Lunes"},
    {"value": 2, "label": "Martes"},
    {"value": 3, "label": "Miércoles"},
    {"value": 4, "label": "Jueves"},
    {"value": 5, "label": "Viernes"},
    {"value": 6, "label": "Sábado"}
]

# Base para Employee que NO incluye campos sensibles
class EmployeeBase(BaseModel):
    role: str = Field(..., min_length=2, max_length=20)
    day_labor: Optional[List[int]] = Field(None, description="Días laborales (0=Domingo a 6=Sábado)")


# Para crear empleado - incluye todos los campos necesarios
class EmployeeCreate(EmployeeBase):
    name: str = Field(..., min_length=2, max_length=60)
    last_name: str = Field(..., min_length=2, max_length=60)
    second_last_name: Optional[str] = Field(None, min_length=2, max_length=60)
    phone: str = Field(..., pattern=r"^\+?\d{10,15}$")
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: str = Field(..., min_length=6, max_length=255)
    photo_url: Optional[str] = None

# Para actualizar empleado - todos los campos opcionales
class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=60)
    last_name: Optional[str] = Field(None, min_length=2, max_length=60)
    second_last_name: Optional[str] = Field(None, min_length=2, max_length=60)
    phone: Optional[str] = Field(None, pattern=r"^\+?\d{10,15}$")
    email: Optional[str] = Field(None, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: Optional[str] = Field(None, min_length=6, max_length=255)
    role: Optional[str] = Field(None, min_length=2, max_length=20)
    day_labor: Optional[List[int]] = None
    is_active: Optional[bool] = None


# Para leer empleado - no incluye password
class EmployeeRead(EmployeeBase):
    id: int
    name: str
    last_name: str
    second_last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now())

    model_config = ConfigDict(from_attributes=True)


class EmployeeMinimalRead(BaseModel):
    id: int
    name: str = Field(validation_alias=AliasPath('user', 'name'))
    last_name: str = Field(validation_alias=AliasPath('user', 'last_name'))
    role: str
    day_labor: Optional[List[int]] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator("name", "last_name", mode="before")
    @classmethod
    def get_user_attributes(cls, v, info):
        if hasattr(info.data.get("__root__") or v, "user"):
            user = getattr(v, "user", None)
            if user:
                return getattr(user, info.field_name, "N/A")
        return v