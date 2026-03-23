from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Enum
import enum 
from sqlalchemy.orm import relationship
from app.database.connection import Base

class MovementType(enum.Enum):
    IN = "entrada"
    OUT = "salida"
    ADJUSTMENT = "ajuste"

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("order_products.id", ondelete="CASCADE"), nullable=True)

    # Uso correcto de Enum en SQLAlchemy
    type = Column(Enum(MovementType), nullable=False)
    amount = Column(Integer, nullable=False, default=1)
    note = Column(String(100), nullable=True) 

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relaciones
    product = relationship("Product", back_populates="movements")
    employee = relationship("Employee", foreign_keys=[employee_id])
    order = relationship("OrderProduct") 
