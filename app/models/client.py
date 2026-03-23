from sqlalchemy import Column, Integer,String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id",ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    address=Column(String(255), nullable=True)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    user=relationship("User",back_populates="client")
    vehicles = relationship("Vehicle", back_populates="client", cascade="all, delete-orphan")
    orders=relationship("OrderService",back_populates="client")