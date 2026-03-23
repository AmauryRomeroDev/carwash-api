from sqlalchemy import Column, Integer,String, Boolean, DateTime, ForeignKey, func,DECIMAL
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Service(Base):
    __tablename__="services"
    
    id = Column(Integer, primary_key=True, index=True)
    service_name=Column(String(100), nullable=False)
    description=Column(String(100), nullable=False)
    total=Column(DECIMAL(10,2), nullable=False)
    duration_minutes=Column(Integer, nullable=False)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    services=relationship("OrderService", back_populates="service")