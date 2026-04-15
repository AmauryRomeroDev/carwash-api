# app/api/v1/services.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal

from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.service import Service
from app.models.user import User  # ✅ Importar User
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate
from app.models.order_service import OrderService
from app.schemas.order_service import OrderServiceRead
from app.models.client import Client as ClientModel

router = APIRouter()

# Permiso: Solo Administradores
allow_admin = RoleChecker(["admin"])

# READ ALL -----------------
@router.get("/", response_model=List[ServiceRead])
def list_services(
    db: Session = Depends(get_db),
    active_only: bool = True
):
    """Lista todos los servicios."""
    query = db.query(Service)
    if active_only:
        query = query.filter(Service.is_active == True)
    return query.all()

# Read One -----------------------------------
@router.get("/{service_id}", response_model=ServiceRead)
def get_service(
    service_id: int, 
    db: Session = Depends(get_db)
):
    """Detalle de un servicio específico."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return service

# CREATE ----------------
@router.post("/", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Solo admins pueden crear servicios
    if current_user.type != "employee" or not current_user.employee or current_user.employee.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear servicios")
    
    # Calcular total: price - discount (si tiene descuento)
    if data.has_discount and data.discount > 0:
        total = data.price - data.discount
        # Asegurar que total no sea negativo
        if total < 0:
            raise HTTPException(status_code=400, detail="El descuento no puede ser mayor que el precio")
    else:
        total = data.price
    
    new_service = Service(
        service_name=data.service_name,
        description=data.description,
        price=data.price,
        total=total,  # ✅ Ahora tiene un valor calculado
        discount=data.discount if data.has_discount else 0,
        has_discount=data.has_discount,
        duration_minutes=data.duration_minutes,
        is_active=True
    )
    
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

# Update ----------------------
@router.patch("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int, 
    data: ServiceUpdate, 
    db: Session = Depends(get_db), 
    _=Depends(allow_admin)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    # Extraer solo campos enviados
    update_data = data.model_dump(exclude_unset=True)
    
    # Si se actualiza price o discount, recalcular total
    if 'price' in update_data or 'discount' in update_data or 'has_discount' in update_data:
        new_price = update_data.get('price', service.price)
        new_discount = update_data.get('discount', service.discount)
        new_has_discount = update_data.get('has_discount', service.has_discount)
        
        if new_has_discount and new_discount > 0:
            total = new_price - new_discount
            if total < 0:
                raise HTTPException(status_code=400, detail="El descuento no puede ser mayor que el precio")
            update_data['total'] = total
        else:
            update_data['total'] = new_price
    
    for key, value in update_data.items():
        # Limpiar strings
        if isinstance(value, str):
            clean_value = value.strip()
            if clean_value.lower() == "string" or not clean_value:
                continue
            value = clean_value
        
        setattr(service, key, value)

    db.commit()
    db.refresh(service)
    return service

# DELETE / DEACTIVATE -------------------
@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int, 
    db: Session = Depends(get_db), 
    _=Depends(allow_admin)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Borrado lógico para mantener integridad en el historial de órdenes
    service.is_active = False 
    db.commit()
    return None