from sqlalchemy import Column, Integer,String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Vehicle(Base):
    __tablename__="vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"))
    
    liscence_plate = Column(String(20), nullable=False) 
    brand = Column(String(50), nullable=False) 
    model = Column(String(50), nullable=False) 
    vehicle_type = Column(String(50), nullable=False) 
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    client=relationship("Client",back_populates="vehicles" )
    orders=relationship("OrderService",back_populates="vehicle")