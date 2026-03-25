# app/api/v1/vehicles.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database.connection import get_db
from app.core.dependencies import get_current_user

from typing import List
from app.models.vehicle import Vehicle
from app.models.user import User
from app.models.client import Client

from app.schemas.vehicle import VehicleCreate, VehicleRead, VehicleUpdate

router = APIRouter()

@router.post("/", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    data: VehicleCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Determinar el client_id final
    target_client_id = None

    # Si es Administrador, usa el client_id que viene en el JSON
    if current_user.type == "employee" and current_user.employee.role == "admin":
        target_client_id = data.client_id
    
    # Si es Cliente, forzamos que el auto sea para ÉL mismo
    elif current_user.type == "client":
        if not current_user.client:
            raise HTTPException(status_code=400, detail="Perfil de cliente no encontrado")
        target_client_id = current_user.client.id
    
    else:
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para registrar vehículos"
        )

    # 2. Verificar si la placa ya existe
    if db.query(Vehicle).filter(Vehicle.liscence_plate == data.liscence_plate).first():
        raise HTTPException(status_code=400, detail="La placa ya está registrada")

    # 3. Crear el vehículo
    new_vehicle = Vehicle(
        liscence_plate=data.liscence_plate,
        brand=data.brand,
        model=data.model,
        color=data.color,
        vehicle_type=data.vehicle_type,
        client_id=target_client_id
    )
    
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return db.query(Vehicle).options(
        joinedload(Vehicle.client).joinedload(Client.user)
    ).filter(Vehicle.id == new_vehicle.id).first()


# Read client vehicles ------------------
@router.get("/me", response_model=List[VehicleRead])
def get_vehicles(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Vehicle).options(
        joinedload(Vehicle.client).joinedload(Client.user)
    )
    
    # Filtro: Si no es admin, solo ve sus propios autos
    is_admin = current_user.type == "employee" and current_user.employee.role == "admin"
    
    if not is_admin:
        if current_user.type != "client" or not current_user.client:
            raise HTTPException(status_code=403, detail="No tienes un perfil de cliente asociado")
        query = query.filter(Vehicle.client_id == current_user.client.id)
    
    return query.all()

# Read vehicles ---------------
@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle_by_id(
    vehicle_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
    # Validar propiedad
    is_admin = current_user.type == "employee" and current_user.employee.role == "admin"
    if not is_admin and vehicle.client_id != current_user.client.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este vehículo")
        
    return vehicle



# Update---------------------------------------------
@router.patch("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: int, 
    data: VehicleUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    # Validar Permisos
    is_admin = current_user.type == "employee" and current_user.employee and current_user.employee.role == "admin"
    is_owner = current_user.type == "client" and current_user.client and vehicle.client_id == current_user.client.id

    if not (is_admin or is_owner):
        raise HTTPException(status_code=403, detail="No tienes permiso para editar el vehiculo")

    # Limpieza de actualización
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if isinstance(value, str):
            clean_value = value.strip()
            # Ignorar si es "string" o espacios vacíos
            if clean_value.lower() == "string" or not clean_value:
                continue
            # Normalizar placas a mayúsculas
            value = clean_value.upper() if key == "liscence_plate" else clean_value
        
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    
    # Retornar con relaciones cargadas para evitar el ValidationError
    return db.query(Vehicle).options(
        joinedload(Vehicle.client).joinedload(Client.user)
    ).filter(Vehicle.id == vehicle.id).first()


# DELETE VEHICLE ------------------------------
@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Buscar el vehículo
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    # 2. Validar Permisos (Misma lógica que Update)
    is_admin = (current_user.type == "employee" and 
                current_user.employee and 
                current_user.employee.role == "admin")
    
    is_owner = (current_user.type == "client" and 
                current_user.client and 
                vehicle.client_id == current_user.client.id)

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para eliminar este vehículo"
        )

    db.delete(vehicle)
    db.commit()
    
    return None 
