from sqlalchemy import Column, Integer,String, Boolean, DateTime, ForeignKey, func,DECIMAL
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Product(Base):
    __tablename__="products"
    id = Column(Integer, primary_key=True, index=True)
    product_name=Column(String)
    description=Column(String(255), nullable=True)
    unit_price=Column(DECIMAL(10,2),nullable=False,default=0.00)
    stock=Column(Integer, nullable=False, default=0)
    
    discount= Column(Integer, default=0)
    has_discount= Column(Boolean, default=False)
    
    is_active=Column(Boolean,nullable=False,default=True)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    orders=relationship("OrderProduct",back_populates="product")
    movements=relationship("InventoryMovement",back_populates="product")