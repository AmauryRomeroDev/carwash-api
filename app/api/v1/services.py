from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate

router = APIRouter()

# Permiso: Solo Administradores (Employee con rol admin)
allow_admin = RoleChecker(["admin"])

# READ ALL -----------------
@router.get("/", response_model=List[ServiceRead])
def list_services(db: Session = Depends(get_db)):
    """Lista todos los servicios activos del catálogo"""
    return db.query(Service).filter(Service.is_active == True).all()

# Read One -----------------------------------
@router.get("/{service_id}", response_model=ServiceRead)
def get_service(service_id: int, db: Session = Depends(get_db)):
    """Detalle de un servicio específico"""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return service

# CREATE ----------------
@router.post("/", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user), # Inyecta el usuario actual
    _=Depends(allow_admin) 
):
    if db.query(Service).filter(Service.service_name == data.service_name).first():
        raise HTTPException(status_code=400, detail="Ya existe un servicio con ese nombre")
    
    new_service = Service(
        service_name=data.service_name,
        description=data.description,
        price=data.price,
        duration_minutes=data.duration_minutes
    )
    
    new_service = Service(**data.model_dump())
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

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
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
