from pydantic import BaseModel, Field, ConfigDict, field_validator, AliasPath
from typing import Optional
from datetime import datetime
from .user import UserBase

class EmployeeBase (UserBase):
    role: str = Field(...,min_length=2, max_length=20)
    
class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    pass 

class EmployeeRead(EmployeeBase):
    id: int
    role: str
    name: str
    last_name:str
    second_last_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    is_active: bool
    created_at: datetime=Field(default_factory=lambda:datetime.now())
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now())

    model_config = ConfigDict(from_attributes=True)
    
class EmployeeMinimalRead (BaseModel):
    id:int
    name: str = Field(validation_alias=AliasPath('user', 'name'))
    last_name: str = Field(validation_alias=AliasPath('user', 'last_name'))
    role:str
    
    model_config = ConfigDict(from_attributes=True)
    @field_validator("name", "last_name", mode="before")
    @classmethod
    def get_user_attributes(cls, v, info):
        # Si 'v' es el objeto Employee, buscamos el atributo en su relación 'user'
        if hasattr(info.data.get("__root__") or v, "user"):
            user = getattr(v, "user", None)
            if user:
                return getattr(user, info.field_name, "N/A")
        return v
