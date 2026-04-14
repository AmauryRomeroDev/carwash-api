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
from app.models.client import Client

# Esquemas
from app.schemas.order_service import (
    OrderServiceCreate,
    OrderServiceRead,
    OrderServiceUpdate,
    ServiceTicketItem,
    ServiceTicketResponse,
)


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
    current_user: User = Depends(allow_staff),
):
    """
    Obtiene todas las órdenes.
    - active_only=true: Solo órdenes vigentes.
    - active_only=false: Incluye órdenes anuladas/eliminadas lógicamente.
    """
    query = db.query(OrderService).options(
        joinedload(OrderService.service), joinedload(OrderService.vehicle)
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
    current_user: User = Depends(allow_staff),
):
    """Obtiene el detalle completo de una orden por su ID"""
    order = (
        db.query(OrderService)
        .options(joinedload(OrderService.service), joinedload(OrderService.vehicle))
        .filter(OrderService.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    return order


# sells ------------------------------------
def get_next_ticket_id(db: Session):
    # Busca el valor máximo de ticket_id y le suma 1. Si no hay nada, empieza en 1.
    max_id = db.query(func.max(OrderService.ticket_id)).scalar()
    return (max_id or 0) + 1


@router.post("/services/sells", response_model=ServiceTicketResponse)
def create_bulk_service_orders(
    orders_data: List[OrderServiceCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_staff = current_user.type in ["employee", "admin"]
    # El casher solo se asigna si es staff operando en mostrador
    employee_id = current_user.employee.id if is_staff and current_user.employee else None

    ticket_items = []
    grand_total = Decimal("0.00")
    next_ticket = get_next_ticket_id(db)
    
    # Nombre del cliente para la respuesta (se define fuera para el return)
    final_customer_name = "Público General"

    for data in orders_data:
        # 1. Buscar el servicio
        service = db.query(Service).filter(Service.id == data.service_id).first()
        if not service:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Servicio ID {data.service_id} no encontrado")

        # 2. Lógica de Descuento (Calculado sobre el precio base)
        db_has_discount = getattr(service, "has_discount", False)
        db_discount_pct = Decimal(str(getattr(service, "discount", 0)))
        final_discount = db_discount_pct if db_has_discount else Decimal("0.00")

        # 3. Lógica de Descuento
        price_base = Decimal(str(service.price or "0.00")) # Asegura que no sea None
        db_has_discount = getattr(service, "has_discount", False)
        db_discount_pct = Decimal(str(getattr(service, "discount", 0)))

        final_discount = db_discount_pct if db_has_discount else Decimal("0.00")
        discount_amount = price_base * (final_discount / Decimal("100"))

# Este es el valor que se guarda en la DB
        final_subtotal = price_base - discount_amount

        # 3. Asignación de Cliente (Token vs JSON)
        if not is_staff:
            # Si es cliente logueado, forzamos su ID del token
            actual_client_id = current_user.client.id if current_user.client else None
        else:
            # Si es staff, usamos el del JSON (si es 0, queda como Público General / NULL)
            actual_client_id = data.client_id if data.client_id != 0 else None

        # 4. Vehículo y lógica de is_temporary
        v_id = data.vehicle_id if data.vehicle_id != 0 else None
        vehicle = None
        if v_id:
            vehicle = db.query(Vehicle).filter(Vehicle.id == v_id).first()
            if vehicle:
                # Seguridad: El vehículo debe ser del cliente si es compra online
                if not is_staff and vehicle.client_id != actual_client_id:
                    db.rollback()
                    raise HTTPException(status_code=403, detail="Vehículo no pertenece al cliente")
                
                # SI EL SERVICIO YA TIENE HORA DE FINALIZACIÓN, EL VEHÍCULO DEJA DE SER TEMPORAL
                if data.completion_time:
                    vehicle.is_temporary = False

        # 5. Lavador (Washer): Staff puede asignar, Online va NULL
        w_id = data.washer_id if (is_staff and data.washer_id != 0) else None

        # 6. Crear Registro
        new_order = OrderService(
            ticket_id=next_ticket,
            client_id=actual_client_id,
            vehicle_id=v_id,
            service_id=data.service_id,
            washer_id=w_id,
            casher_id=employee_id, # Puede ser NULL
            delivery_time=data.delivery_time,
            start_time=data.start_time,
            completion_time=data.completion_time,
            subtotal=final_subtotal,
            notes=getattr(data, "notes", ""),
            is_active=True,
        )
        db.add(new_order)

        # 7. Preparar item para el ticket
        ticket_items.append({
            "service_name": service.service_name,
            "vehicle_plate": vehicle.liscence_plate if vehicle else "N/A",
            "price_base": float(price_base),
            "discount": float(final_discount),
            "total": float(final_subtotal),
        })

    db.commit()

    # 8. Nombre del Cliente para el Return
    if not is_staff:
        final_customer_name = f"{current_user.name} {current_user.last_name}"
    elif actual_client_id:
        c_obj = db.query(Client).options(joinedload(Client.user)).filter(Client.id == actual_client_id).first()
        if c_obj and c_obj.user:
            final_customer_name = f"{c_obj.user.name} {c_obj.user.last_name}"

    display_name = f"Mostrador - {current_user.name}" if is_staff else "Compra Online"

    return {
        "ticket_id": next_ticket,
        "casher_name": display_name,
        "client_name": final_customer_name,
        "created_at": datetime.now(),
        "items": ticket_items,
        "grand_total": float(grand_total),
    }

# UPDATE (Ajustado para permitir actualizar Washer y tiempos)
@router.patch("/services/{order_id}", response_model=OrderServiceRead)
def update_service_order(
    order_id: int,
    data: OrderServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff),
):
    order = db.query(OrderService).filter(OrderService.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    update_data = data.model_dump(exclude_unset=True)

    # Si se actualiza el washer_id
    if "washer_id" in update_data:
        order.washer_id = update_data["washer_id"] if update_data["washer_id"] != 0 else None

    # Si se marca como terminado en el update, también actualizamos el vehículo
    if "completion_time" in update_data and update_data["completion_time"]:
        order.completion_time = update_data["completion_time"]
        if order.vehicle:
            order.vehicle.is_temporary = False

    # Aplicar el resto de campos (notes, delivery_time, etc)
    for key, value in update_data.items():
        if hasattr(order, key) and key not in ["washer_id", "completion_time"]:
            setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return order


# DELETE--------------------------------------------

@router.delete("/services/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_or_delete_service_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user), # Obtenemos el usuario genérico
):
    order = db.query(OrderService).filter(OrderService.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # --- LÓGICA DE PERMISOS DE CANCELACIÓN ---
    
    is_admin = current_user.type == "admin"
    is_employee = current_user.type == "employee"
    
    # Verificar si el usuario es el dueño de la reserva (Cliente)
    is_owner = False
    if current_user.type == "client" and current_user.client:
        is_owner = (order.client_id == current_user.client.id)

    # Solo pueden "cancelar" si: es Admin, es Empleado, o es el Dueño de la orden
    if not (is_admin or is_employee or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para cancelar esta orden"
        )

    # --- RESTRICCIÓN DE ESTADO ---
    # Opcional: No permitir cancelar si el servicio ya se completó
    if order.completion_time:
        raise HTTPException(
            status_code=400, 
            detail="No se puede cancelar un servicio que ya ha sido marcado como completado"
        )

    # Borrado lógico (Cancelación)
    order.is_active = False
    
    # Si quieres dejar rastro de quién canceló, podrías añadir un campo 'notes'
    cancel_msg = f" - Cancelado por {current_user.type}: {current_user.name}"
    order.notes = (order.notes or "") + cancel_msg

    db.commit()
    return None

# Ticket -------------------------------------------------
@router.get("/services/tickets/{ticket_id}", response_model=ServiceTicketResponse)
def get_service_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Carga de datos con todas las relaciones
    orders = (
        db.query(OrderService)
        .options(
            joinedload(OrderService.service),
            joinedload(OrderService.client).joinedload(Client.user),
            joinedload(OrderService.vehicle),
            joinedload(OrderService.casher).joinedload(Employee.user),
        )
        .filter(OrderService.ticket_id == ticket_id)
        .all()
    )

    if not orders:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    first_order = orders[0]
    
    # --- SEGURIDAD ---
    is_staff = current_user.type in ["admin", "employee"]
    user_client_id = current_user.client.id if (current_user.type == "client" and current_user.client) else None
    
    # Comparamos el client_id de la orden con el del token
    is_owner = (user_client_id is not None and first_order.client_id == user_client_id)

    if not (is_staff or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este ticket",
        )

    # --- LÓGICA DE NOMBRES (CASHER Y CLIENTE) ---
    
    # Caso 1: ONLINE (No hay Casher)
    if not first_order.casher:
        display_casher = f"Servicio Online"
        # Buscamos el nombre del cliente dueño de la orden
        if first_order.client and first_order.client.user:
            c = first_order.client.user
            customer_name = f"{c.name} {c.last_name}"
        else:
            customer_name = "Usuario Online"

    # Casos con CASHER (Venta Presencial)
    else:
        casher_u = first_order.casher.user
        
        # Caso 2: VENTA MOSTRADOR (Hay Casher y hay Cliente registrado)
        if first_order.client and first_order.client.user:
            client_u = first_order.client.user
            display_casher = f"Venta Mostrador: {casher_u.name}"
            customer_name = f"{client_u.name} {client_u.last_name}"
            
        # Caso 3: VENTA RÁPIDA (Hay Casher pero NO hay Cliente)
        else:
            display_casher = "Venta Rápida"
            customer_name = casher_u.name

    # 4. Mapeo de items
    ticket_items = []
    for o in orders:
        price_base = float(o.service.price) if o.service else 0.0
        total_item = float(o.subtotal)
        discount_val = ((price_base - total_item) / price_base * 100) if price_base > 0 else 0
        
        ticket_items.append({
            "service_name": o.service.service_name if o.service else "Servicio",
            "vehicle_plate": o.vehicle.liscence_plate if o.vehicle else "N/A",
            "price_base": price_base,
            "discount": round(discount_val, 2),
            "total": total_item
        })

    return {
        "ticket_id": ticket_id,
        "casher_name": display_casher,
        "client_name": customer_name,
        "created_at": first_order.created_at,
        "items": ticket_items,
        "grand_total": float(sum(order.subtotal for order in orders)),
    }
