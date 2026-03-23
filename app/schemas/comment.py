from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

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
    user_name: str
    user_photo: Optional[str]
    content: str
    service_name: str
    rating: int = Field(ge=1, le=5)
    created_at: datetime
    replies: List[CommentReplyResponse] = []

    class Config:
        from_attributes = True

# Para crear un comentario nuevo
class CommentCreate(BaseModel):
    content: str
    service_id: Optional[int] = None 
    rating: Optional[int] = None    
    parent_id: Optional[int] = None 
