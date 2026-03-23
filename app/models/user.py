from sqlalchemy import Column, Integer,String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__="users"
    
    id= Column(Integer, primary_key=True, index=True)
    
    name = Column(String(60), nullable=True)
    last_name = Column(String(60), nullable=True)
    second_last_name = Column(String(60), nullable=True)
    phone_number = Column(String(20), nullable=True, index=True)
    email = Column(String(120), nullable=False, unique=True, index=True)
    password= Column(String(255), nullable=False)   
    type=Column(String(20), nullable=True, index=True)
    
    is_active = Column(Boolean, nullable=False, server_default="true", default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    client=relationship("Client", back_populates="user", uselist=False, cascade="all, delete-orphan")
    employee=relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")