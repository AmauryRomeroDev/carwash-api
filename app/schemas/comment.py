from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List, Optional
from .user import UserMinimalRead
from .service import ServiceMinimalRead

# Responses
class CommentReplyResponse(BaseModel):
    author: UserMinimalRead 
    user_photo: Optional[str]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# Principal Comment
class CommentMainResponse(BaseModel):
    id:int
    content: str
    rating: Optional[int]
    created_at: datetime
    # Accedemos a las relaciones de SQLAlchemy
    author: "UserMinimalRead"
    service: Optional["ServiceMinimalRead"]
    replies: List["CommentReplyResponse"] = []

    class Config:
        from_attributes = True
    @field_validator('replies', mode='before')
    @classmethod
    def allow_none_as_empty_list(cls, v):
        return v if v is not None else []

# Para crear un comentario nuevo
class CommentCreate(BaseModel):
    content: str
    service_id: Optional[int] = None 
    rating: Optional[int] = None    
    parent_id: Optional[int] = None 
    
# Al final de app/schemas/comment.py
CommentMainResponse.model_rebuild()
CommentReplyResponse.model_rebuild()

