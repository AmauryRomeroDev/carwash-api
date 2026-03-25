from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from decimal import Decimal
from datetime import datetime

from app.database.connection import get_db
from app.core.dependencies import RoleChecker, get_current_user

from app.models.user import User
from app.models.vehicle import Vehicle 
from app.models.order_service import OrderService
from app.models.service import Service
from app.models.employee import Employee

# Esquemas
from app.schemas.order_service import OrderServiceCreate, OrderServiceRead,OrderServiceUpdate,ServiceTicketItem,ServiceTicketResponse



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

# 1 by 1 -------------------------------
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

# Bulk -----------------------------------------------
@router.post("/services/bulk", response_model=ServiceTicketResponse)
def create_bulk_service_orders(
    orders_data: List[OrderServiceCreate], 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    ticket_items = []
    grand_total = Decimal("0.00")
    
    for data in orders_data:
        # 1. Buscar el servicio
        service = db.query(Service).filter(Service.id == data.service_id).first()
        if not service:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Servicio ID {data.service_id} no encontrado")

        # 2. Calcular subtotal real
        price_base = Decimal(str(service.price))
        discount_percent = Decimal(str(data.discount))
        discount_amount = price_base * (discount_percent / Decimal("100"))
        final_subtotal = price_base - discount_amount
        
        grand_total += final_subtotal

        # 3. Limpiar IDs
        w_id = data.washer_id if data.washer_id != 0 else None
        v_id = data.vehicle_id if data.vehicle_id != 0 else None
        c_id = data.client_id if data.client_id != 0 else None

        # 4. Crear registro
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
        db.flush() # Para obtener datos si se necesitan relaciones
        
        # 5. Preparar item para el ticket (usando nombres para el AliasChoices)
        vehicle = db.query(Vehicle).filter(Vehicle.id == v_id).first()
        
        ticket_items.append({
            "service_name": service.service_name,
            "vehicle_plate": vehicle.liscence_plate if vehicle else "N/A",
            "price_base": float(price_base),
            "discount": float(data.discount),
            "total": float(final_subtotal)
        })

    db.commit()

    return {
        "casher_name": f"{current_user.name} {current_user.last_name}",
        "created_at": datetime.now(),
        "items": ticket_items,
        "grand_total": float(grand_total)
    }


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


# Ticket -------------------------------------------------
from app.core.dependencies import get_current_user # Asegúrate de importar esto

@router.get("/services/tickets/{order_id}", response_model=ServiceTicketResponse)
def get_service_ticket(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # 1. Inyectamos el usuario
):
    # Traemos la orden con todas sus relaciones cargadas
    order = db.query(OrderService).options(
        joinedload(OrderService.service),
        joinedload(OrderService.vehicle).joinedload(Vehicle.client), # Cargamos dueño del auto
        joinedload(OrderService.casher).joinedload(Employee.user)
    ).filter(OrderService.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # 2. Validación de Seguridad (Capa de persistencia/privacidad)
    is_admin = (current_user.type == "employee" and 
                current_user.employee and 
                current_user.employee.role == "admin")
    
    # Verificamos si el vehículo de la orden pertenece al cliente logueado
    is_owner = (current_user.type == "client" and 
                current_user.client and 
                order.vehicle.client_id == current_user.client.id)

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permiso para ver este ticket"
        )

    # 3. Mapeo al esquema
    return {
        "casher_name": f"{order.casher.user.name} {order.casher.user.last_name}",
        "created_at": order.created_at,
        "items": [order],
        "grand_total": float(order.subtotal)
    }
