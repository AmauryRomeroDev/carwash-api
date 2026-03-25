from app.models.user import User
from app.schemas.order_product import OrderProductCreate, OrderProductRead,OrderProductUpdate
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


# Esaquemas
from app.schemas.order_product import OrderProductCreate,TicketResponse,TicketItemRead
from sqlalchemy.orm import joinedload
from app.schemas.inventory_movements import InventoryMovementCreate, InventoryMovementRead



router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])

# get sells -------------------------------------------
@router.get("/orders/products", response_model=List[OrderProductRead])
def get_product_sales(
    product_id: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    """
    Obtiene el historial de ventas de productos.
    - Si se envía product_id, filtra solo las ventas de ese producto.
    - Si no, devuelve todas las ventas registradas.
    """
    query = db.query(OrderProduct).options(
        joinedload(OrderProduct.product),
        joinedload(OrderProduct.casher).joinedload(Employee.user)
    )
    
    if product_id:
        query = query.filter(OrderProduct.product_id == product_id)
    
    # Ordenar por las más recientes primero
    return query.order_by(OrderProduct.created_at.desc()).all()

@router.get("/orders/products/{item_id}", response_model=OrderProductRead)
def get_product_sale_by_id(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    """Obtiene el detalle de una venta de producto específica por su ID"""
    sale = db.query(OrderProduct).options(
        joinedload(OrderProduct.product),
        joinedload(OrderProduct.casher).joinedload(Employee.user)
    ).filter(OrderProduct.id == item_id).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
        
    return sale

# Create order 1 to 1 ----------------------------------------
@router.post("/orders/products", response_model=OrderProductRead, status_code=status.HTTP_201_CREATED)
def create_product_order(
    data: OrderProductCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    # 1. Validar producto y stock
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product or product.stock < data.amount:
        raise HTTPException(status_code=400, detail="Stock insuficiente o producto no existe")

    # 2. Cálculos monetarios (Precio * Cantidad - Descuento)
    unit_price = Decimal(str(product.unit_price))
    amount = Decimal(str(data.amount))
    discount = Decimal(str(data.discount))
    
    subtotal = unit_price * amount
    total_final = subtotal - discount

    # 3. Registrar la venta
    new_order_item = OrderProduct(
        product_id=data.product_id,
        casher_id=current_user.employee.id, # Usamos el ID del perfil de empleado
        amount=data.amount,
        discount=discount,
        subtotal=total_final,
        total=subtotal
    )
    
    # 4. Actualizar stock y registrar movimiento (OUT)
    product.stock -= data.amount
    movement = InventoryMovement(
        product_id=data.product_id,
        employee_id=current_user.employee.id,
        type="OUT",
        amount=data.amount,
        note=f"Venta directa ID: {new_order_item.id}"
    )

    db.add(new_order_item)
    db.add(movement)
    db.commit()
    db.refresh(new_order_item)
    return new_order_item

# Create order Bulk ------------------------
@router.post("/orders/products/bulk", response_model=TicketResponse)
def create_bulk_product_sale(
    items_data: List[OrderProductCreate], # Recibe una lista [{}, {}]
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="El usuario no es empleado")

    new_items = []
    total_ticket = Decimal("0.00")

    # 1. Procesar cada producto solicitado
    for item in items_data:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        
        # Validar existencia y stock
        if not product or product.stock < item.amount:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente para: {product.name if product else item.product_id}"
            )

        # 2. Cálculos por producto
        u_price = Decimal(str(product.unit_price))
        qty = Decimal(str(item.amount))
        disc = Decimal(str(item.discount))
        
        subtotal = u_price * qty
        final_price = subtotal - disc
        total_ticket += final_price

        # 3. Preparar el registro de venta
        order_item = OrderProduct(
            product_id=item.product_id,
            casher_id=current_user.employee.id,
            amount=item.amount,
            discount=disc,
            subtotal=subtotal,
            total=final_price
        )
        
        # 4. Descontar stock y registrar movimiento (OUT)
        product.stock -= item.amount
        movement = InventoryMovement(
            product_id=product.id,
            employee_id=current_user.employee.id,
            type="OUT",
            amount=item.amount,
            note="Venta en lote"
        )
        
        db.add(order_item)
        db.add(movement)
        new_items.append(order_item)

    db.commit()
    
    # 5. Generar la respuesta del Ticket con Joins
    # Aquí puedes retornar un objeto con el ID del primer item como referencia del ticket
    return {
        "ticket_id": new_items[0].id if new_items else 0,
        "casher_name": f"{current_user.name} {current_user.last_name}",
        "created_at": datetime.now(),
        "items": new_items,
        "grand_total": float(total_ticket)
    }

# Update order -----------------------------
@router.patch("/orders/products/{item_id}", response_model=OrderProductRead)
def update_product_order(
    item_id: int, 
    data: OrderProductUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_admin)
):
    order_item = db.query(OrderProduct).filter(OrderProduct.id == item_id).first()
    if not order_item:
        raise HTTPException(status_code=404, detail="Registro de venta no encontrado")

    product = db.query(Product).filter(Product.id == order_item.product_id).first()
    update_data = data.model_dump(exclude_unset=True)

    # Re-ajuste de stock si cambia la cantidad
    if "amount" in update_data:
        diff = update_data["amount"] - order_item.amount
        if product.stock < diff:
            raise HTTPException(status_code=400, detail="No hay stock suficiente para el cambio")
        product.stock -= diff
        order_item.amount = update_data["amount"]

    # Re-cálculo de precios
    unit_price = Decimal(str(product.unit_price))
    order_item.discount = Decimal(str(update_data.get("discount", order_item.discount)))
    order_item.subtotal = unit_price * Decimal(str(order_item.amount))
    order_item.total = order_item.subtotal - order_item.discount

    db.commit()
    db.refresh(order_item)
    return order_item

# Order delete ----------------------------------
@router.delete("/orders/products/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_order(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_admin)
):
    order_item = db.query(OrderProduct).filter(OrderProduct.id == item_id).first()
    if not order_item:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    # Devolver stock al producto
    product = db.query(Product).filter(Product.id == order_item.product_id).first()
    if product:
        product.stock += order_item.amount
        
        # Registrar re-ingreso por cancelación
        movement = InventoryMovement(
            product_id=product.id,
            employee_id=current_user.employee.id,
            type="IN",
            amount=order_item.amount,
            note=f"Devolución por cancelación de venta ID: {order_item.id}"
        )
        db.add(movement)

    db.delete(order_item)
    db.commit()
    return None

# Ticket -------------------------

@router.get("/orders/tickets/{reference_id}", response_model=TicketResponse)
def get_ticket_detail(
    reference_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    # 1. Consulta optimizada con Joins
    sales = db.query(OrderProduct).options(
        joinedload(OrderProduct.product),
        joinedload(OrderProduct.casher).joinedload(Employee.user)
    ).filter(OrderProduct.id == reference_id).all() 

    if not sales:
        raise HTTPException(status_code=404, detail="Ticket o venta no encontrada")

    # 2. Datos del Cajero y Tiempos (Usando el primer registro)
    first_row = sales[0]
    casher_info = first_row.casher.user
    
    ticket_items = []
    grand_total = 0.0
    
    # 3. Mapeo de items
    for sale in sales:
        item = TicketItemRead(
            product_name=sale.product.product_name,
            unit_price=float(sale.product.unit_price),
            amount=sale.amount,
            discount=float(sale.discount),
            subtotal=float(sale.subtotal),
            total=float(sale.total)
        )
        ticket_items.append(item)
        grand_total += float(sale.total)

    # 4. Respuesta estructurada
    return TicketResponse(
        ticket_id=reference_id,
        casher_name=f"{casher_info.name} {casher_info.last_name}",
        created_at=first_row.created_at,
        items=ticket_items,
        grand_total=grand_total
    )
