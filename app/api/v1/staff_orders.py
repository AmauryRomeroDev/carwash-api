from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timezone

from app.database.connection import get_db
from app.core.dependencies import RoleChecker, get_current_user

from app.models.user import User
from app.models.product import Product
from app.models.order_product import OrderProduct
from app.models.inventory_movements import InventoryMovement
from app.models.employee import Employee
from app.models.client import Client

# Esquemas
from app.schemas.order_product import (
    OrderProductCreate, 
    OrderProductRead, 
    OrderProductUpdate, 
    TicketResponse
)

router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])

# --- Helpers ---
def get_next_ticket_id(db: Session):
    max_id = db.query(func.max(OrderProduct.ticket_id)).scalar()
    return (max_id or 0) + 1

def format_ticket_items(orders: List[OrderProduct]):
    """Calcula el descuento aplicado por cada producto para el ticket"""
    items_list = []
    for o in orders:
        monto_descuento = float(o.subtotal - o.total)
        
        # Precio unitario base (antes de descuento)
        u_price = float(o.subtotal / o.amount) if o.amount > 0 else 0.0
        
        items_list.append({
            "product_name": o.product.product_name if o.product else "Producto",
            "unit_price": u_price,
            "amount": int(o.amount),
            "subtotal": float(o.subtotal),
            "discount": monto_descuento, 
            "total": float(o.total)
        })
    return items_list


# --- Endpoints ---

@router.get("/orders/products")  # Sin response_model
def get_product_sales(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff),
):
    query = db.query(OrderProduct).options(
        joinedload(OrderProduct.product),
        joinedload(OrderProduct.casher).joinedload(Employee.user),
        joinedload(OrderProduct.client).joinedload(Client.user),
    )
    if product_id:
        query = query.filter(OrderProduct.product_id == product_id)
    
    orders = query.order_by(OrderProduct.created_at.desc()).all()
    
    # Serializar manualmente
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "ticket_id": order.ticket_id,
            "product_id": order.product_id,
            "client_id": order.client_id,
            "casher_id": order.casher_id,
            "amount": order.amount,
            "subtotal": float(order.subtotal),
            "total": float(order.total),
            "discount": float(order.discount) if hasattr(order, 'discount') else 0,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "product": {
                "id": order.product.id,
                "product_name": order.product.product_name,
                "description": order.product.description,
                "unit_price": float(order.product.unit_price),
                "stock": order.product.stock,
                "discount": float(order.product.discount) if order.product.discount else 0,
                "has_discount": order.product.has_discount,
                "is_active": order.product.is_active,
            } if order.product else None,
            "casher": {
                "id": order.casher.id,
                "name": order.casher.user.name if order.casher.user else None,
                "last_name": order.casher.user.last_name if order.casher.user else None,
            } if order.casher and order.casher.user else None,
            "client": {
                "id": order.client.id,
                "name": order.client.user.name if order.client.user else None,
                "last_name": order.client.user.last_name if order.client.user else None,
            } if order.client and order.client.user else None,
        })
    
    return result

@router.get("/orders/products/all")
def get_all_product_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff),
):
    """
    Obtiene TODAS las órdenes de productos sin filtros.
    Útil para exportaciones o sincronizaciones completas.
    Solo accesible para staff (admin y empleados).
    """
    # Consulta con eager loading de relaciones
    orders = db.query(OrderProduct).options(
        joinedload(OrderProduct.product),
        joinedload(OrderProduct.casher).joinedload(Employee.user),
        joinedload(OrderProduct.client).joinedload(Client.user),
    ).order_by(OrderProduct.created_at.desc()).all()
    
    # Serializar manualmente los resultados
    serialized_orders = []
    for order in orders:
        serialized_orders.append({
            "id": order.id,
            "ticket_id": order.ticket_id,
            "product_id": order.product_id,
            "client_id": order.client_id,
            "casher_id": order.casher_id,
            "amount": order.amount,
            "subtotal": float(order.subtotal) if order.subtotal else 0.0,
            "total": float(order.total) if order.total else 0.0,
            "discount": float(order.discount) if hasattr(order, 'discount') and order.discount else 0.0,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "product": {
                "id": order.product.id,
                "product_name": order.product.product_name,
                "description": order.product.description,
                "unit_price": float(order.product.unit_price) if order.product.unit_price else 0.0,
                "stock": order.product.stock or 0,
                "discount": float(order.product.discount) if order.product.discount else 0.0,
                "has_discount": order.product.has_discount or False,
                "is_active": order.product.is_active,
            } if order.product else None,
            "casher": {
                "id": order.casher.id,
                "name": order.casher.user.name if order.casher and order.casher.user else None,
                "last_name": order.casher.user.last_name if order.casher and order.casher.user else None,
                "role": order.casher.role if order.casher else None,
            } if order.casher and order.casher.user else None,
            "client": {
                "id": order.client.id,
                "name": order.client.user.name if order.client and order.client.user else None,
                "last_name": order.client.user.last_name if order.client and order.client.user else None,
            } if order.client and order.client.user else None,
        })
    
    # Estadísticas generales
    total_revenue = db.query(func.sum(OrderProduct.total)).scalar() or 0.0
    total_items = db.query(func.sum(OrderProduct.amount)).scalar() or 0
    total_transactions = db.query(func.count(func.distinct(OrderProduct.ticket_id))).scalar() or 0
    
    return {
        "data": serialized_orders,
        "total_count": len(serialized_orders),
        "summary": {
            "total_revenue": float(total_revenue),
            "total_items_sold": int(total_items),
            "total_transactions": int(total_transactions),
            "average_ticket": float(total_revenue / total_transactions if total_transactions > 0 else 0)
        }
    }

@router.post("/orders/products/sells", response_model=TicketResponse)
def create_bulk_product_sale(
    items_data: List[OrderProductCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Identificar si es Staff (Empleado/Admin) o Cliente
    is_staff = current_user.type in ["admin", "employee"]
    
    # --- ASIGNACIÓN AUTOMÁTICA DEL CLIENTE ---
    if not is_staff:
        # Si es CLIENTE: El ID viene forzosamente de su relación en el Token
        actual_client_id = current_user.client.id if current_user.client else None
        if not actual_client_id:
            raise HTTPException(status_code=400, detail="El usuario no tiene un perfil de cliente asociado")
    else:
        # Si es STAFF: Usamos el client_id del JSON (si es 0 o nulo, queda como venta al público)
        first_item = items_data[0]
        actual_client_id = first_item.client_id if first_item.client_id != 0 else None

    # El casher_id solo si es Staff
    employee_id = current_user.employee.id if is_staff and current_user.employee else None
    
    total_ticket = Decimal("0.00")
    next_ticket = get_next_ticket_id(db)
    new_orders = []

    for item in items_data:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product or product.stock < item.amount:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name if product else 'ID '+str(item.product_id)}")

        # Lógica de Precios
        pct = Decimal(str(product.discount)) if product.has_discount else Decimal("0")
        u_price = Decimal(str(product.unit_price))
        line_total = (u_price - (u_price * (pct / Decimal("100")))) * Decimal(str(item.amount))
        line_subtotal = u_price * Decimal(str(item.amount))
        total_ticket += line_total

        # CREACIÓN CON ID AUTOMÁTICO
        order_item = OrderProduct(
            ticket_id=next_ticket,
            product_id=item.product_id,
            client_id=actual_client_id, # <--- Aquí se asigna lo del Token o JSON
            casher_id=employee_id,
            amount=item.amount,
            subtotal=line_subtotal,
            total=line_total,
        )
        product.stock -= item.amount
        db.add(order_item)
        new_orders.append(order_item)

    db.commit()
    for o in new_orders: db.refresh(o)

        # 1. Determinar el nombre del cliente para la respuesta inmediata
    if not is_staff:
        # Caso Cliente: Nombre desde el Token
        full_client_name = f"{current_user.name} {current_user.last_name}"
    elif actual_client_id:
        # Caso Staff con Cliente asignado: Buscamos en la relación
        c_obj = db.query(Client).filter(Client.id == actual_client_id).first()
        full_client_name = f"{c_obj.user.name} {c_obj.user.last_name}" if c_obj and c_obj.user else "Cliente Registrado"
    else:
        # Caso Staff sin cliente
        full_client_name = "Público General"

    return {
        "ticket_id": next_ticket,
        "casher_name": "Compra Online" if not is_staff else f"Mostrador - {current_user.name}",
        "client_name": full_client_name, # <--- ESTO ES LO QUE FALTA EN TU JSON
        "created_at": datetime.now(timezone.utc),
        "items": format_ticket_items(new_orders),
        "grand_total": float(total_ticket)
    }


@router.get("/orders/tickets/{ticket_id}", response_model=TicketResponse)
def get_product_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Carga de datos con relaciones completas
    orders = (
        db.query(OrderProduct)
        .options(
            joinedload(OrderProduct.product),
            joinedload(OrderProduct.casher).joinedload(Employee.user),
            joinedload(OrderProduct.client).joinedload(Client.user)
        )
        .filter(OrderProduct.ticket_id == ticket_id)
        .all()
    )

    if not orders:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    first_order = orders[0]

    # 2. Validación de Seguridad (Corregida: Compara Client_ID, no Order_ID)# En el GET del ticket
    is_staff = current_user.type in ["admin", "employee"]
    user_client_id = current_user.client.id if (current_user.type == "client" and current_user.client) else None

    # ID del dueño guardado en la orden
    order_owner_id = first_order.client_id 
    
    is_owner = (user_client_id is not None and user_client_id == order_owner_id)

    if not is_staff and orders[0].client_id != user_client_id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    # 3. Lógica de Nombres y Visualización
    
    # --- Responsable (Cajero) ---
    if first_order.casher and first_order.casher.user:
        u = first_order.casher.user
        display_casher = f"Mostrador - {u.name} {u.last_name}"
    else:
        display_casher = "Compra Online"

    # --- Nombre del Cliente ---
    if first_order.client and first_order.client.user:
        c = first_order.client.user
        customer_name = f"{c.name} {c.last_name}"
    else:
        customer_name = "Público General"

    return {
        "ticket_id": ticket_id,
        "casher_name": display_casher,
        "client_name": customer_name,
        "created_at": first_order.created_at,
        "items": format_ticket_items(orders), 
        "grand_total": float(sum(o.total for o in orders)),
    }

@router.patch("/orders/products/{item_id}", response_model=OrderProductRead)
def update_product_order(
    item_id: int,
    data: OrderProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    order_item = db.query(OrderProduct).filter(OrderProduct.id == item_id).first()
    if not order_item:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    product = db.query(Product).filter(Product.id == order_item.product_id).first()
    update_data = data.model_dump(exclude_unset=True)

    if "amount" in update_data:
        diff = update_data["amount"] - order_item.amount
        if product.stock < diff:
            raise HTTPException(status_code=400, detail="Stock insuficiente")
        product.stock -= diff
        order_item.amount = update_data["amount"]

    # Recalcular con base en el precio unitario guardado o actual
    u_price = Decimal(str(product.unit_price))
    order_item.subtotal = u_price * Decimal(str(order_item.amount))
    # Aquí podrías ajustar el descuento si viene en el update_data
    order_item.total = order_item.subtotal - (order_item.subtotal * (order_item.discount / Decimal("100")))

    db.commit()
    db.refresh(order_item)
    return order_item

@router.delete("/orders/products/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_order(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    order_item = db.query(OrderProduct).filter(OrderProduct.id == item_id).first()
    if not order_item:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    product = db.query(Product).filter(Product.id == order_item.product_id).first()
    if product:
        product.stock += order_item.amount
        db.add(InventoryMovement(
            product_id=product.id,
            employee_id=current_user.employee.id if current_user.employee else None,
            type="IN",
            amount=order_item.amount,
            note=f"Cancelación venta ID: {order_item.id}",
        ))

    db.delete(order_item)
    db.commit()
    return None

@router.patch("/orders/tickets/{ticket_id}/complete")
def complete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    """
    Marca un ticket como completado (no elimina, solo registra la acción).
    Solo accesible para admin.
    """
    # Verificar que el ticket existe
    orders = db.query(OrderProduct).filter(OrderProduct.ticket_id == ticket_id).all()
    
    if not orders:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Registrar la acción de completado (puedes agregar un log si tienes tabla de logs)
    # o simplemente retornar éxito
    
    return {
        "message": f"Ticket #{ticket_id} marcado como completado",
        "ticket_id": ticket_id,
        "status": "completed",
        "items_count": len(orders),
        "total": float(sum(o.total for o in orders))
    }


@router.delete("/orders/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    """
    Elimina completamente un ticket y todos sus items.
    Restaura el stock de los productos.
    Solo accesible para admin.
    """
    # Obtener todos los items del ticket
    orders = db.query(OrderProduct).filter(OrderProduct.ticket_id == ticket_id).all()
    
    if not orders:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Restaurar stock y eliminar items
    for order in orders:
        product = db.query(Product).filter(Product.id == order.product_id).first()
        if product:
            product.stock += order.amount
            db.add(InventoryMovement(
                product_id=product.id,
                employee_id=current_user.employee.id if current_user.employee else None,
                type="IN",
                amount=order.amount,
                note=f"Eliminación de ticket #{ticket_id}",
            ))
        
        db.delete(order)
    
    db.commit()
    
    return None