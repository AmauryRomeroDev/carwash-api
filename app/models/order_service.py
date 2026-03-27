from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, DECIMAL
from sqlalchemy.orm import relationship
from app.database.connection import Base

class OrderService(Base):
    __tablename__ = "order_services"
    
    id = Column(Integer, primary_key=True, index=True)
    
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    ticket_id=Column(Integer, nullable=False)
    
    # Empleados (Ambos apuntan a la tabla 'employees')
    washer_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    casher_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    
    delivery_time = Column(DateTime, nullable=False)
    notes= Column(String, nullable=True)
    start_time = Column(DateTime, nullable=True, server_default=func.now())
    completion_time = Column(DateTime, nullable=True)
    
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relaciones alineadas con  otras clases
    client = relationship("Client", back_populates="orders")
    vehicle = relationship("Vehicle", back_populates="orders")
    service = relationship("Service", back_populates="services")

    # Para los empleados usamos foreign_keys para evitar la ambigüedad
    washer = relationship("Employee", foreign_keys=[washer_id])
    casher = relationship("Employee", foreign_keys=[casher_id])
