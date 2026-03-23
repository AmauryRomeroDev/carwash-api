from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from .user import UserMinimalRead
from .service import ServiceMinimalRead

# Responses
class CommentReplyResponse(BaseModel):
    user_name: str
    user_photo: Optional[str]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# Principal Comment
class CommentMainResponse(BaseModel):
    id: int
    content: str
    rating: Optional[int]
    created_at: datetime
    # Accedemos a las relaciones de SQLAlchemy
    author: Optional["UserMinimalRead"] 
    service: Optional["ServiceMinimalRead"]
    replies: List["CommentReplyResponse"] = []

    class Config:
        from_attributes = True


# Para crear un comentario nuevo
class CommentCreate(BaseModel):
    content: str
    service_id: Optional[int] = None 
    rating: Optional[int] = None    
    parent_id: Optional[int] = None 
