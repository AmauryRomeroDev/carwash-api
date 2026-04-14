# app/schemas/comment.py
from pydantic import BaseModel, field_validator, Field
from datetime import datetime
from typing import List, Optional
from .user import UserMinimalRead
from .service import ServiceMinimalRead


# Responses
class CommentReplyResponse(BaseModel):
    id: int
    author: UserMinimalRead 
    content: str
    rating: Optional[int] = None
    created_at: datetime
    is_active: bool = True
    is_approved: bool = True

    class Config:
        from_attributes = True


# Principal Comment
class CommentMainResponse(BaseModel):
    id: int
    content: str
    rating: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Accedemos a las relaciones de SQLAlchemy
    author: UserMinimalRead
    service: Optional[ServiceMinimalRead] = None
    replies: List[CommentReplyResponse] = []
    is_active: bool = True
    is_approved: bool = True

    class Config:
        from_attributes = True
    
    @field_validator('replies', mode='before')
    @classmethod
    def allow_none_as_empty_list(cls, v):
        if isinstance(v, list):
            return v
        return []


# Para crear un comentario nuevo
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    service_id: Optional[int] = None 
    rating: Optional[int] = Field(None, ge=1, le=5)    
    parent_id: Optional[int] = None 


# Para actualizar un comentario
class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=1000)
    rating: Optional[int] = Field(None, ge=1, le=5)


# Para aprobar/rechazar comentario (admin)
class CommentModerate(BaseModel):
    is_approved: bool


# Al final de app/schemas/comment.py
CommentMainResponse.model_rebuild()
CommentReplyResponse.model_rebuild()