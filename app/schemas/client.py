from pydantic import BaseModel,EmailStr, Field,computed_field ,ConfigDict,field_validator,model_validator
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone

if TYPE_CHECKING: 
    from .vehicle import VehicleMinimalRead
from .user import UserBase,UserMinimalRead

class ClientBase(UserBase):
    address: Optional[str]= Field(...,min_length=5, max_length=100)
    

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    name: Optional[str] = Field(...,min_length=2, max_length=60)
    last_name: Optional[str]= Field(...,min_length=2, max_length=60)
    email: Optional[EmailStr] = None
    phone: Optional[str]= Field(..., pattern=r"^\+?\d{10,15}$")


class ClientRead(ClientBase):
    id:int
    client: Optional[UserMinimalRead]=None
    is_active: bool
    vehicles: List['VehicleMinimalRead']=[]
    created_at: datetime=Field(default_factory=lambda:datetime.now(timezone.utc))
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
    

class ClientMinimalRead(BaseModel):
    id: int
    name: str = "N/A"
    last_name: str = "N/A"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def get_user_data(cls, data):
        # Si 'data' es un objeto de SQLAlchemy (Client)
        user = getattr(data, "user", None)
        if user:
            # Extraemos los datos del objeto User y los inyectamos en el diccionario
            # Ajusta 'full_name' o 'first_name' según como se llamen en tu modelo User
            return {
                "id": getattr(data, "id"),
                "name": getattr(user, "name", getattr(user, "full_name", "N/A")),
                "last_name": getattr(user, "last_name", "N/A"),
                "email": getattr(user, "email", None),
                "phone": getattr(user, "phone_number", None)
            }
        return data
