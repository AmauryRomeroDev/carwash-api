from pydantic import BaseModel
from datetime import datetime

class SessionStatus(BaseModel):
    is_active: bool
    last_login: datetime
