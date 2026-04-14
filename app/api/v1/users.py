# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile,File
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.models.order_service import OrderService
from app.models.order_product import OrderProduct
from app.models.service import Service
from app.models.product import Product
from app.models.employee import Employee
from app.schemas.user import UserUpdate, UserRead
from app.core.security import get_password_hash
from app.models.session import UserSession
from app.schemas.order_service import  OrderServiceRead
import os
import shutil

router = APIRouter()

# Read ------------
@router.get("/me")
async def get_current_user_data(current_user: User = Depends(get_current_user)):
    response = {
        "id": current_user.id,
        "photo_url": current_user.photo_url,
        "name": current_user.name,
        "last_name": current_user.last_name,
        "second_last_name": current_user.second_last_name,
        "email": current_user.email,
        "type": current_user.type,
        "phone": current_user.phone_number, 
    }
    
    if current_user.type == "employee" and current_user.employee:
        response["role"] = current_user.employee.role
    elif current_user.type == "client" and current_user.client:
        response["address"] = current_user.client.address
        
    return response

# Update -----------
@router.patch("/me", response_model=UserRead)
def update_own_profile(
    data: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Traemos al objeto a la sesión actual
    current_user = db.merge(current_user)
    
    # Extraemos solo lo que el usuario envió en el JSON
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        # 1. Filtro para Strings (Limpiar espacios y evitar el valor por defecto 'string')
        if isinstance(value, str):
            clean_value = value.strip()
            
            # Si es solo espacios ("  ") o es el texto "string" de Swagger, lo ignoramos
            if not clean_value or clean_value.lower() == "string":
                continue
            value = clean_value

        # 2. Hashing de contraseña (solo si pasó el filtro anterior)
        if key == "password":
            value = get_password_hash(value)
        
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

# Update profile photo -----------
@router.post("/me/image")
async def upload_profile_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user = db.merge(current_user)
    
    # 1. Validación de tipo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    # 2. Carpeta de destino
    UPLOAD_DIR = "static/profile_pics"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 3. Nombre del archivo (usamos el ID para que sea único)
    extension = os.path.splitext(file.filename)[1]
    file_name = f"user_{current_user.id}{extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    # 4. Guardar archivo físico
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="No se pudo guardar la imagen")

    # 5. ACTUALIZAR TU MODELO (Usando tu campo photo_url)
    # Guardamos la ruta relativa que empieza con /static/...
    current_user.photo_url = f"/{file_path}" 
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Imagen actualizada", 
        "photo_url": current_user.photo_url
    }
       
# Delete for admin ------------
allow_admin = RoleChecker(["admin"])

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(allow_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.is_active = False
    db.commit()
    return None

# Logout -----------------------------------------------------
@router.post("/logout")
def logout(
    request: Request, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Usamos el token que el middleware inyectó en request.state
    token = getattr(request.state, "token", None)

    session = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.token == token,
        UserSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada o ya cerrada")

    session.is_active = False
    db.commit()
    return {"detail": "Sesión cerrada exitosamente"}

# Delete user (desactivate profile) -----------------
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_my_account(
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Traemos al objeto a la sesión actual
    current_user = db.merge(current_user)
    current_user.is_active = False

    # 2. También cerramos su sesión actual para que sea expulsado inmediatamente
    token = getattr(request.state, "token", None)
    session = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.token == token
    ).first()
    
    if session:
        session.is_active = False

    db.commit()
    return None

# Show products and services of the user -----------------
@router.get("/my-purchase-history", status_code=status.HTTP_200_OK)
async def get_my_purchase_history(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el historial de servicios solicitados y productos comprados
    por el usuario autenticado.
    """
    # 1. Validar que el usuario sea de tipo cliente y tenga perfil asociado
    if current_user.type != "client" or not current_user.client:
        raise HTTPException(
            status_code=403, 
            detail="Solo los clientes tienen un historial de compras personal."
        )
    
    client_id = current_user.client.id

    # 2. Consultar Servicios (con carga de relación al nombre del servicio)
    services = (
        db.query(OrderService)
        .options(joinedload(OrderService.service))
        .filter(OrderService.client_id == client_id)
        .order_by(OrderService.created_at.desc())
        .all()
    )

    # 3. Consultar Productos
    products = (
        db.query(OrderProduct)
        .options(joinedload(OrderProduct.product))
        .filter(OrderProduct.client_id == client_id)
        .order_by(OrderProduct.created_at.desc())
        .all()
    )

    # 4. Formatear respuesta
    return {
        "services": [
            {
                "id": s.id,
                "ticket_id": s.ticket_id,
                "service_name": s.service.service_name if s.service else "N/A",
                "date": s.created_at,
                "total": float(s.subtotal),
                "status": "Completado" if s.completion_time else "En proceso",
                "notes": s.notes
            } for s in services
        ],
        "products": [
            {
                "id": p.id,
                "ticket_id": p.ticket_id,
                "product_name": p.product.product_name if p.product else "N/A",
                "amount": p.amount,
                "date": p.created_at,
                "total": float(p.subtotal)
            } for p in products
        ]
    }
    
# app/api/v1/users.py

# Get all user's service bookings (reservas)
@router.get("/my-bookings", status_code=status.HTTP_200_OK)
async def get_my_bookings(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene todas las reservas de servicios del usuario autenticado.
    Incluye tanto activas como canceladas (is_active = false)
    """
    # Validar que el usuario sea de tipo cliente
    if current_user.type != "client" or not current_user.client:
        raise HTTPException(
            status_code=403, 
            detail="Solo los clientes pueden ver sus reservas."
        )
    
    client_id = current_user.client.id

    # Consultar todos los servicios del cliente con sus relaciones (incluyendo inactivos)
    bookings = (
        db.query(OrderService)
        .options(
            joinedload(OrderService.service),
            joinedload(OrderService.vehicle),
            joinedload(OrderService.washer).joinedload(Employee.user),
            joinedload(OrderService.casher).joinedload(Employee.user)
        )
        .filter(OrderService.client_id == client_id)
        .order_by(OrderService.created_at.desc())
        .all()
    )

    # Formatear respuesta incluyendo is_active
    return [
        {
            "id": booking.id,
            "ticket_id": booking.ticket_id,
            "service": {
                "id": booking.service.id if booking.service else None,
                "name": booking.service.service_name if booking.service else "N/A",
                "price": float(booking.service.price) if booking.service else 0,
                "duration_minutes": booking.service.duration_minutes if booking.service else 0
            },
            "vehicle": {
                "id": booking.vehicle.id if booking.vehicle else None,
                "brand": booking.vehicle.brand if booking.vehicle else "N/A",
                "model": booking.vehicle.model if booking.vehicle else "N/A",
                "license_plate": booking.vehicle.liscence_plate if booking.vehicle else "N/A"
            },
            "status": get_booking_status(booking),
            "status_code": get_booking_status_code(booking),
            "subtotal": float(booking.subtotal) if booking.subtotal else 0,
            "delivery_time": booking.delivery_time.isoformat() if booking.delivery_time else None,
            "start_time": booking.start_time.isoformat() if booking.start_time else None,
            "completion_time": booking.completion_time.isoformat() if booking.completion_time else None,
            "notes": booking.notes,
            "created_at": booking.created_at.isoformat() if booking.created_at else None,
            "updated_at": booking.updated_at.isoformat() if booking.updated_at else None,
            "is_active": booking.is_active,  # <--- AGREGADO: indica si la reserva está activa o cancelada
            "assigned_washer": {
                "id": booking.washer.id if booking.washer else None,
                "name": f"{booking.washer.user.name} {booking.washer.user.last_name}" if booking.washer and booking.washer.user else None
            } if booking.washer else None,
            "processed_by": {
                "id": booking.casher.id if booking.casher else None,
                "name": f"{booking.casher.user.name} {booking.casher.user.last_name}" if booking.casher and booking.casher.user else None
            } if booking.casher else None
        }
        for booking in bookings
    ]


# Get one user's service booking by ID
@router.get("/my-bookings/{booking_id}", status_code=status.HTTP_200_OK)
async def get_my_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene una reserva específica del usuario autenticado por su ID.
    """
    # Validar que el usuario sea de tipo cliente
    if current_user.type != "client" or not current_user.client:
        raise HTTPException(
            status_code=403, 
            detail="Solo los clientes pueden ver sus reservas."
        )
    
    client_id = current_user.client.id

    # Buscar la reserva específica
    booking = (
        db.query(OrderService)
        .options(
            joinedload(OrderService.service),
            joinedload(OrderService.vehicle),
            joinedload(OrderService.washer).joinedload(Employee.user),
            joinedload(OrderService.casher).joinedload(Employee.user)
        )
        .filter(
            OrderService.id == booking_id,
            OrderService.client_id == client_id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontró la reserva con ID {booking_id}"
        )

    # Formatear respuesta incluyendo is_active
    return {
        "id": booking.id,
        "ticket_id": booking.ticket_id,
        "service": {
            "id": booking.service.id if booking.service else None,
            "name": booking.service.service_name if booking.service else "N/A",
            "description": booking.service.description if booking.service else None,
            "price": float(booking.service.price) if booking.service else 0,
            "duration_minutes": booking.service.duration_minutes if booking.service else 0,
            "has_discount": booking.service.has_discount if booking.service else False,
            "discount": booking.service.discount if booking.service else 0
        },
        "vehicle": {
            "id": booking.vehicle.id if booking.vehicle else None,
            "brand": booking.vehicle.brand if booking.vehicle else "N/A",
            "model": booking.vehicle.model if booking.vehicle else "N/A",
            "color": booking.vehicle.color if booking.vehicle else "N/A",
            "license_plate": booking.vehicle.liscence_plate if booking.vehicle else "N/A",
            "vehicle_type": booking.vehicle.vehicle_type if booking.vehicle else "N/A"
        },
        "status": get_booking_status(booking),
        "status_code": get_booking_status_code(booking),
        "subtotal": float(booking.subtotal) if booking.subtotal else 0,
        "delivery_time": booking.delivery_time.isoformat() if booking.delivery_time else None,
        "start_time": booking.start_time.isoformat() if booking.start_time else None,
        "completion_time": booking.completion_time.isoformat() if booking.completion_time else None,
        "notes": booking.notes,
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "updated_at": booking.updated_at.isoformat() if booking.updated_at else None,
        "is_active": booking.is_active,  # <--- AGREGADO: indica si la reserva está activa o cancelada
        "assigned_washer": {
            "id": booking.washer.id if booking.washer else None,
            "name": f"{booking.washer.user.name} {booking.washer.user.last_name}" if booking.washer and booking.washer.user else None,
            "email": booking.washer.user.email if booking.washer and booking.washer.user else None
        } if booking.washer else None,
        "processed_by": {
            "id": booking.casher.id if booking.casher else None,
            "name": f"{booking.casher.user.name} {booking.casher.user.last_name}" if booking.casher and booking.casher.user else None
        } if booking.casher else None
    }


# Helper function to get booking status
def get_booking_status(booking: OrderService) -> str:
    """Determina el estado de la reserva basado en fechas y is_active"""
    # Si está cancelada (borrado lógico)
    if not booking.is_active:
        return "Cancelado"
    if booking.completion_time:
        return "Completado"
    elif booking.start_time and booking.start_time <= datetime.now():
        return "En Proceso"
    elif booking.delivery_time:
        return "Agendado"
    else:
        return "Pendiente"


# Helper function to get booking status code
def get_booking_status_code(booking: OrderService) -> str:
    """Devuelve un código de estado para la reserva"""
    if not booking.is_active:
        return "cancelled"
    if booking.completion_time:
        return "completed"
    elif booking.start_time and booking.start_time <= datetime.now():
        return "in_progress"
    elif booking.delivery_time:
        return "scheduled"
    else:
        return "pending"
    