from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from decimal import Decimal

from app.database.connection import get_db
from app.core.dependencies import RoleChecker, get_current_user

from app.models.user import User
from app.models.product import Product
from app.models.order_service import OrderService
from app.models.service import Service

# Esquemas
from app.schemas.order_service import OrderServiceCreate, OrderServiceRead,OrderServiceUpdate



router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])

# --- DASHBOARD & STATS ---

# By Status -------------------------------
@router.get("/services", response_model=List[OrderServiceRead])
def get_all_service_orders(
    is_active: bool = True, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    """
    Obtiene todas las órdenes. 
    - active_only=true: Solo órdenes vigentes.
    - active_only=false: Incluye órdenes anuladas/eliminadas lógicamente.
    """
    query = db.query(OrderService).options(
        joinedload(OrderService.service),
        joinedload(OrderService.vehicle)
    )
    
    if is_active:
        query = query.filter(OrderService.is_active == True)
    else:
        query = query.filter(OrderService.is_active == False)
        
    return query.all()

# By ID ---------------------
@router.get("/services/{order_id}", response_model=OrderServiceRead)
def get_service_order_by_id(
    order_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    """Obtiene el detalle completo de una orden por su ID"""
    order = db.query(OrderService).options(
        joinedload(OrderService.service),
        joinedload(OrderService.vehicle)
    ).filter(OrderService.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
        
    return order


# --- GESTIÓN DE ÓRDENES (SERVICIOS) ---

@router.post("/services", response_model=OrderServiceRead, status_code=status.HTTP_201_CREATED)
def create_staff_order(
    data: OrderServiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    # 1. Buscar el servicio para obtener el precio base ("total" en tu DB)
    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    # 2. Calcular el subtotal real
    # Subtotal = Precio - (Precio * Descuento / 100)
    price_base = Decimal(str(service.price))  # Recuerda que en tu modelo lo mapeamos como 'price'
    discount_amount = Decimal(str(data.discount))
    
    subtotal = price_base*(discount_amount/Decimal("100"))
    
    final_subtotal= price_base-subtotal

    # 3. Limpiar IDs (0 a None) para evitar errores de FK
    w_id = data.washer_id if data.washer_id != 0 else None
    v_id = data.vehicle_id if data.vehicle_id != 0 else None
    c_id = data.client_id if data.client_id != 0 else None

    # 4. Crear la orden
    new_order = OrderService(
        client_id=c_id,
        vehicle_id=v_id,
        service_id=data.service_id,
        washer_id=w_id,
        casher_id=current_user.id, 
        delivery_time=data.delivery_time,
        start_time=data.start_time,
        completion_time=data.completion_time,
        discount=data.discount,
        subtotal=final_subtotal, 
        is_active=True
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# UPDATE -----------------------------------------------

@router.patch("/services/{order_id}", response_model=OrderServiceRead)
def update_service_order(
    order_id: int,
    data: OrderServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    # 1. Buscar la orden existente
    order = db.query(OrderService).filter(OrderService.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # 2. Extraer datos enviados (ignorando los 'string' o vacíos)
    update_data = data.model_dump(exclude_unset=True)
    
    # 3. RE-CALCULAR SUBTOTAL (Si cambia el servicio o el descuento)
    if "service_id" in update_data or "discount" in update_data:
        # Obtenemos el servicio (el nuevo o el que ya tenía)
        s_id = update_data.get("service_id", order.service_id)
        service = db.query(Service).filter(Service.id == s_id).first()
        
        if service:
            price_base = Decimal(str(service.price))
            # Obtenemos el descuento (el nuevo o el que ya tenía)
            discount_val = Decimal(str(update_data.get("discount", order.discount)))
            
            discount_money = price_base * (discount_val / Decimal("100"))
            update_data["subtotal"] = price_base - discount_money

    # 4. Limpieza de IDs y strings (Evitar ceros y basura de Swagger)
    for key, value in update_data.items():
        if key in ["washer_id", "vehicle_id", "client_id"] and value == 0:
            value = None
        if isinstance(value, str) and (value.lower() == "string" or not value.strip()):
            continue
        
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return order
# DELETE--------------------------------------------
@router.delete("/services/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin) 
):
    order = db.query(OrderService).filter(OrderService.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # Borrado lógico
    order.is_active = False
    db.commit()
    return None



