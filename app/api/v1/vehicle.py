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
    """
    Crear un nuevo vehículo.
    
    - **Clientes**: Pueden crear vehículos solo para sí mismos (client_id se ignora o debe ser el suyo)
    - **Administradores**: Pueden crear vehículos para cualquier cliente especificando client_id
    """
    target_client_id = None

    # CASO 1: USUARIO CLIENTE
    if current_user.type == "client":
        # Verificar que el cliente tenga un perfil asociado
        if not current_user.client:
            raise HTTPException(
                status_code=400, 
                detail="Tu perfil de cliente no existe en la base de datos"
            )
        
        # Si el cliente envió un client_id, verificar que sea el suyo
        if data.client_id:
            # Verificar que el client_id corresponda a su usuario
            client = db.query(Client).filter(
                Client.id == data.client_id,
                Client.user_id == current_user.id
            ).first()
            
            if not client:
                raise HTTPException(
                    status_code=403, 
                    detail="No puedes registrar vehículos para otro cliente"
                )
            target_client_id = client.id
        else:
            # Usar su propio client_id
            target_client_id = current_user.client.id
    
    # CASO 2: EMPLEADO ADMIN
    elif current_user.type == "employee":
        # Verificar que sea admin
        if not current_user.employee or current_user.employee.role != "admin":
            raise HTTPException(
                status_code=403, 
                detail="No tienes permisos de administrador"
            )
        
        # Admin debe especificar un client_id válido
        if not data.client_id or data.client_id == 0:
            raise HTTPException(
                status_code=400, 
                detail="Como administrador, debes especificar un ID de cliente válido"
            )
        
        # Resolver el client_id (puede ser user_id o client_id)
        target_client_id = resolve_client_id(db, data.client_id)
        if not target_client_id:
            raise HTTPException(
                status_code=404, 
                detail=f"No se encontró un cliente con ID {data.client_id}"
            )
    
    # CASO 3: OTRO TIPO DE USUARIO
    else:
        raise HTTPException(
            status_code=403, 
            detail=f"Tipo de usuario '{current_user.type}' no autorizado para crear vehículos"
        )

    # Validación final de seguridad
    if not target_client_id:
        raise HTTPException(
            status_code=400, 
            detail="No se pudo determinar el ID del cliente"
        )

    # Verificar si la placa ya existe (case insensitive)
    existing_vehicle = db.query(Vehicle).filter(
        Vehicle.liscence_plate == data.liscence_plate.upper().strip()
    ).first()
    
    if existing_vehicle:
        raise HTTPException(
            status_code=400, 
            detail=f"La placa {data.liscence_plate} ya está registrada"
        )

    # Crear el vehículo
    try:
        new_vehicle = Vehicle(
            liscence_plate=data.liscence_plate.upper().strip(),
            brand=data.brand.strip().title(),
            model=data.model.strip(),
            color=data.color.strip().capitalize(),
            vehicle_type=data.vehicle_type,
            client_id=target_client_id,
            is_temporary=data.is_temporary if hasattr(data, 'is_temporary') else False
        )
        
        db.add(new_vehicle)
        db.commit()
        db.refresh(new_vehicle)
        
    except Exception as e:
        db.rollback()
        print(f"Error al crear vehículo: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Error al guardar el vehículo en la base de datos"
        )

    # Retornar con relaciones cargadas
    result = db.query(Vehicle).options(
        joinedload(Vehicle.client).joinedload(Client.user)
    ).filter(Vehicle.id == new_vehicle.id).first()

    return result


def resolve_client_id(db: Session, id_value: int) -> int | None:
    """
    Convierte un user_id o client_id al client_id real.
    
    Args:
        db: Sesión de base de datos
        id_value: Puede ser un client_id o un user_id
    
    Returns:
        client_id si se encuentra, None en caso contrario
    """
    # Intentar como client_id directamente
    client = db.query(Client).filter(Client.id == id_value).first()
    if client:
        return client.id
    
    # Intentar como user_id
    client_by_user = db.query(Client).filter(Client.user_id == id_value).first()
    if client_by_user:
        return client_by_user.id
    
    return None


@router.get("/me", response_model=List[VehicleRead])
def get_vehicles(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Obtener vehículos del usuario actual."""
    query = db.query(Vehicle).options(
        joinedload(Vehicle.client).joinedload(Client.user)
    )
    
    # Verificar si es admin
    is_admin = (
        current_user.type == "employee" and 
        current_user.employee and 
        current_user.employee.role == "admin"
    )
    
    # Si no es admin, solo ver sus propios vehículos
    if not is_admin:
        if current_user.type != "client" or not current_user.client:
            raise HTTPException(
                status_code=403, 
                detail="No tienes un perfil de cliente asociado"
            )
        query = query.filter(Vehicle.client_id == current_user.client.id)
    
    vehicles = query.all()
    return vehicles


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle_by_id(
    vehicle_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Obtener un vehículo específico por ID."""
    vehicle = db.query(Vehicle).options(
        joinedload(Vehicle.client).joinedload(Client.user)
    ).filter(Vehicle.id == vehicle_id).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    # Validar permisos
    is_admin = (
        current_user.type == "employee" and 
        current_user.employee and 
        current_user.employee.role == "admin"
    )
    
    is_owner = (
        current_user.type == "client" and 
        current_user.client and 
        vehicle.client_id == current_user.client.id
    )
    
    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para ver este vehículo"
        )
    
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: int, 
    data: VehicleUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Actualizar un vehículo existente."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    # Validar permisos
    is_admin = (
        current_user.type == "employee" and 
        current_user.employee and 
        current_user.employee.role == "admin"
    )
    
    is_owner = (
        current_user.type == "client" and 
        current_user.client and 
        vehicle.client_id == current_user.client.id
    )

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para editar este vehículo"
        )

    # Actualizar campos
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if value is not None:
            # Limpiar strings
            if isinstance(value, str):
                clean_value = value.strip()
                if clean_value and clean_value.lower() != "string":
                    # Normalizar según el campo
                    if key == "liscence_plate":
                        value = clean_value.upper()
                    elif key in ["brand", "model"]:
                        value = clean_value.title()
                    elif key == "color":
                        value = clean_value.capitalize()
                    else:
                        value = clean_value
                else:
                    continue  # Saltar valores vacíos o "string"
            
            setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    
    # Retornar con relaciones cargadas
    return db.query(Vehicle).options(
        joinedload(Vehicle.client).joinedload(Client.user)
    ).filter(Vehicle.id == vehicle.id).first()


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Eliminar un vehículo."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    # Validar permisos
    is_admin = (
        current_user.type == "employee" and 
        current_user.employee and 
        current_user.employee.role == "admin"
    )
    
    is_owner = (
        current_user.type == "client" and 
        current_user.client and 
        vehicle.client_id == current_user.client.id
    )

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para eliminar este vehículo"
        )

    db.delete(vehicle)
    db.commit()
    
    return None