from pydantic import BaseModel, Field, ConfigDict
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
    phone: str
    email: Optional[str]
    is_active: bool
    created_at: datetime=Field(default_factory=lambda:datetime.now())
    updated_at: Optional[datetime]=Field(default_factory=lambda:datetime.now())

    model_config = ConfigDict(from_attributes=True)