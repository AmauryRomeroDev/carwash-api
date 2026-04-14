from sqlalchemy import Column, Integer,String, Boolean, DateTime, ForeignKey, func,JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    role = Column(String(50), nullable=False) 
    day_labor = Column(JSON, nullable=True) 
    is_active=Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    
    user = relationship("User", back_populates="employee")
