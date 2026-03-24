from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from app.database.connection import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    token = Column(String(500), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    
    last_login = Column(DateTime, server_default=func.now(), onupdate=func.now()) 

    class Config:
        from_attributes = True
