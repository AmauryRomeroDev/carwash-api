from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    func,
    DECIMAL,
)
from sqlalchemy.orm import relationship
from app.database.connection import Base


class OrderProduct(Base):
    __tablename__ = "order_products"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    casher_id = Column(
        Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True
    )
    client_id=Column(
        Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=True
    )
    ticket_id= Column(Integer, nullable=False)
    amount = Column(Integer, nullable=False, default=1)
    total = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    subtotal = Column(DECIMAL(10, 2), nullable=False, default=0.00)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relaciones
    product = relationship("Product", back_populates="orders")
    casher = relationship("Employee", foreign_keys=[casher_id])
    client = relationship("Client", back_populates="product_orders" )
