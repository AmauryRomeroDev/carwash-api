from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text,func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True) 
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    
    # Relaciones de Usuario y Servicio
    author_id = Column(Integer, ForeignKey("users.id"))
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    
    # Jerarquía
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)

    # Relaciones 
    author = relationship("User", back_populates="comments_written")
    service = relationship("Service")
    replies = relationship("Comment", backref="parent", remote_side=[id])
