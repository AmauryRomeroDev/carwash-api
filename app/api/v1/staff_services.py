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


# sells ------------------------------------
def get_next_ticket_id(db: Session):
    # Busca el valor máximo de ticket_id y le suma 1. Si no hay nada, empieza en 1.
    max_id = db.query(func.max(OrderService.ticket_id)).scalar()
    return (max_id or 0) + 1

@router.post("/services/sells", response_model=ServiceTicketResponse)
def create_bulk_service_orders(
    orders_data: List[OrderServiceCreate], 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) 
):
    # 1. Identificar si hay un empleado operando
    is_employee = current_user.type == "employee"
    employee_id = current_user.employee.id if is_employee else None
    
    ticket_items = []
    grand_total = Decimal("0.00")
    next_ticket = get_next_ticket_id(db)
    
    for data in orders_data:
        # 2. Buscar el servicio
        service = db.query(Service).filter(Service.id == data.service_id).first()
        if not service:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Servicio ID {data.service_id} no encontrado")

        # 3. Lógica de Descuento (Prioriza DB)
        db_has_discount = getattr(service, 'has_discount', False)
        db_discount_pct = Decimal(str(getattr(service, 'discount', 0)))
        final_discount = db_discount_pct if db_has_discount else Decimal(str(data.discount))
        
        price_base = Decimal(str(service.price))
        discount_amount = price_base * (final_discount / Decimal("100"))
        final_subtotal = price_base - discount_amount
        grand_total += final_subtotal

        # 4. Validación de Cliente y Vehículo
        # Si es cliente, forzamos su ID. Si es staff, usamos el del JSON.
        actual_client_id = current_user.client.id if not is_employee else (data.client_id if data.client_id != 0 else None)
        
        v_id = data.vehicle_id if data.vehicle_id != 0 else None
        if v_id:
            vehicle = db.query(Vehicle).filter(Vehicle.id == v_id).first()
            # Seguridad: Si el cliente compra online, verificamos que el vehículo sea suyo
            if not is_employee and vehicle and vehicle.client_id != actual_client_id:
                db.rollback()
                raise HTTPException(status_code=403, detail=f"El vehículo {vehicle.liscence_plate} no le pertenece")
        else:
            vehicle = None

        # El washer_id solo lo puede asignar un empleado. Si es cliente, va a None.
        w_id = data.washer_id if (is_employee and data.washer_id != 0) else None

        # 5. Crear registro
        new_order = OrderService(
            ticket_id=next_ticket,
            client_id=actual_client_id,
            vehicle_id=v_id,
            service_id=data.service_id,
            washer_id=w_id,
            casher_id=employee_id,
            delivery_time=data.delivery_time,
            start_time=data.start_time,
            completion_time=data.completion_time,
            subtotal=final_subtotal, 
            is_active=True
        )
        db.add(new_order)
        
        # 6. Preparar item para el ticket
        ticket_items.append({
            "service_name": service.service_name,
            "vehicle_plate": vehicle.liscence_plate if vehicle else "N/A",
            "price_base": float(price_base),
            "discount": float(final_discount),
            "total": float(final_subtotal)
        })

    db.commit()

    display_name = f"{current_user.name} {current_user.last_name}" if is_employee else "Compra Online"

    return {
        "ticket_id": next_ticket,
        "casher_name": display_name,
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
    # 1. Buscar la orden
    order = db.query(OrderService).filter(OrderService.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # 2. Extraer datos
    update_data = data.model_dump(exclude_unset=True)
    
    # 3. RE-CALCULAR TOTAL (Si cambia el servicio)
    if "service_id" in update_data:
        service = db.query(Service).filter(Service.id == update_data["service_id"]).first()
        if not service:
            raise HTTPException(status_code=404, detail="Nuevo servicio no encontrado")
        
        # Aplicamos lógica de descuento de la DB
        db_has_discount = getattr(service, 'has_discount', False)
        db_discount_pct = Decimal(str(getattr(service, 'discount', 0)))
        
        final_discount = db_discount_pct if db_has_discount else Decimal(str(update_data.get("discount", order.discount)))
        
        price_base = Decimal(str(service.price))
        discount_money = price_base * (final_discount / Decimal("100"))
        
        order.discount = final_discount
        order.subtotal = price_base - discount_money
        order.service_id = service.id

    # 4. Aplicar el resto de cambios 
    for key, value in update_data.items():
        # Saltamos lo que ya calculamos arriba y el casher_id si viene en 0
        if key in ["service_id", "discount", "subtotal"] or (key == "casher_id" and value == 0):
            continue
            
        if isinstance(value, bool):
            setattr(order, key, value)
            continue

        # Validar IDs: Solo asignar si es un número válido > 0
        if key in ["washer_id", "vehicle_id", "client_id", "casher_id"]:
            if value is None or value == 0:
                continue 

        # Limpieza de strings
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
@router.get("/services/tickets/{ticket_id}", response_model=ServiceTicketResponse)
def get_service_ticket(
    ticket_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #  0.
    is_staff= current_user.type== 'employee'
    employee_id= current_user.employee.id if is_staff else None
    next_ticket= get_next_ticket_id(db)
    
    
    # 1. Traemos todas las órdenes asociadas a ese ticket_id
    orders = db.query(OrderService).options(
        joinedload(OrderService.service),
        joinedload(OrderService.client).joinedload(Client.user),
        joinedload(OrderService.vehicle),
        joinedload(OrderService.casher).joinedload(Employee.user)
    ).filter(OrderService.ticket_id == ticket_id).all()

    if not orders:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    first_order = orders[0]

    customer_name= first_order.vehicle.client.user.name
    
    # 2. Validación de Seguridad
    
    # Validamos si el cliente es dueño del vehículo en la primera orden del ticket
    is_owner = (current_user.type == "client" and 
                current_user.client and 
                first_order.vehicle and 
                first_order.vehicle.client_id == current_user.client.id)

    if not (is_staff or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permiso para ver este ticket"
        )

    # 3. Mapeo al esquema
    total_acumulado = sum(order.subtotal for order in orders)

    # --- Lógica de Responsable (Casher) ---
    if not first_order.employee.user.name:
        display_casher = f"Venta Online - {customer_name}"
    else:
        display_casher= first_order.employee.user.name
        
    return {
        "ticket_id": ticket_id,
        "casher_name": display_casher,
        "client_name": customer_name, 
        "created_at": first_order.created_at,
        "items": orders, 
        "grand_total": float(total_acumulado)
    }
