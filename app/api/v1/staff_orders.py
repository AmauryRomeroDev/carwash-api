from app.models.user import User
from app.schemas.order_product import (
    OrderProductCreate,
    OrderProductRead,
    OrderProductUpdate,
)
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
from app.schemas.order_product import OrderProductCreate, TicketResponse, TicketItemRead
from sqlalchemy.orm import joinedload
from app.schemas.inventory_movements import (
    InventoryMovementCreate,
    InventoryMovementRead,
)


router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])


# get sells -------------------------------------------
@router.get("/orders/products", response_model=List[OrderProductRead])
def get_product_sales(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff),
):
    """
    Obtiene el historial de ventas de productos.
    - Si se envía product_id, filtra solo las ventas de ese producto.
    - Si no, devuelve todas las ventas registradas.
    """
    query = db.query(OrderProduct).options(
        joinedload(OrderProduct.product),
        joinedload(OrderProduct.casher).joinedload(Employee.user),
    )

    if product_id:
        query = query.filter(OrderProduct.product_id == product_id)

    # Ordenar por las más recientes primero
    return query.order_by(OrderProduct.created_at.desc()).all()


# only one item ----
@router.get("/orders/products/{item_id}", response_model=TicketResponse)
def get_product_sale_ticket(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff),
):
    """Obtiene el detalle de una venta individual en formato Ticket"""
    # 1. Buscamos la venta con Joins (para que funcionen los AliasPath de Pydantic)
    sale = (
        db.query(OrderProduct)
        .options(
            joinedload(OrderProduct.product),
            joinedload(OrderProduct.casher).joinedload(Employee.user),
        )
        .filter(OrderProduct.id == item_id)
        .first()
    )

    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    # 2. Mapeamos los datos al esquema TicketResponse
    # Como es individual, la lista 'items' solo tendrá un elemento
    return {
        "ticket_id": sale.id,
        "casher_name": f"{sale.casher.user.name} {sale.casher.user.last_name}",
        "created_at": sale.created_at,
        "items": [sale],  # Metemos el objeto en una lista
        "grand_total": float(sale.total),
    }


# sells ------------------------------------------------------------------------
def get_next_ticket_id(db: Session):
    # Busca el valor máximo de ticket_id y le suma 1. Si no hay nada, empieza en 1.
    max_id = db.query(func.max(OrderProduct.ticket_id)).scalar()
    return (max_id or 0) + 1

@router.post("/orders/products/sells", response_model=TicketResponse)
def create_bulk_product_sale(
    items_data: List[OrderProductCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee_id = current_user.employee.id if current_user.type == "employee" else None

    new_items = []
    total_ticket = Decimal("0.00")
    next_ticket = get_next_ticket_id(db)

    for item in items_data:
        # Bloqueamos la fila del producto para evitar ventas simultáneas 
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .with_for_update()
            .first()
        )

        if not product or product.stock < item.amount:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para: {product.name if product else 'ID ' + str(item.product_id)}",
            )

        # 2. Aplicar descuento de la DB
        pct = (
            Decimal(str(product.discount_percent))
            if product.has_discount
            else Decimal("0")
        )
        u_price = Decimal(str(product.unit_price))

        # Cálculo: Precio con descuento * cantidad
        final_unit_price = u_price - (u_price * (pct / Decimal("100")))
        line_total = final_unit_price * Decimal(str(item.amount))
        total_ticket += line_total

        # 3. Registrar la venta
        order_item = OrderProduct(
            ticket_id=next_ticket,
            product_id=item.product_id,
            casher_id=employee_id,
            amount=item.amount,
            discount=pct,
            subtotal=u_price * Decimal(str(item.amount)),
            total=line_total,
        )

        # 4. Actualizar stock y registrar movimiento de inventario
        product.stock -= item.amount
        db.add(order_item)
        new_items.append(order_item)

    db.commit()

    # 5. Nombre para el Ticket
    display_name = (
        f"{current_user.name} {current_user.last_name}"
        if employee_id
        else "Venta Online"
    )

    return {
        "ticket_id": next_ticket,
        "casher_name": display_name,
        "created_at": datetime.now(timezone.utc),
        "items": new_items,
        "grand_total": float(total_ticket),
    }


# Update order -----------------------------
@router.patch("/orders/products/{item_id}", response_model=OrderProductRead)
def update_product_order(
    item_id: int,
    data: OrderProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin),
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
            raise HTTPException(
                status_code=400, detail="No hay stock suficiente para el cambio"
            )
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
    current_user: User = Depends(allow_admin),
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
            note=f"Devolución por cancelación de venta ID: {order_item.id}",
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
    current_user: User = Depends(get_current_user),
):
    # 1. Consulta con Joins
    sales = (
        db.query(OrderProduct)
        .options(
            joinedload(OrderProduct.product),
            joinedload(OrderProduct.casher).joinedload(Employee.user),
        )
        .filter(OrderProduct.id == reference_id)
        .all()
    )

    if not sales:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    first_row = sales[0]

    # 2. No necesitas mapear uno a uno manualmente si usas from_attributes=True
    # FastAPI/Pydantic usará los AliasPath('product', 'product_name') automáticamente
    return {
        "ticket_id": reference_id,
        "casher_name": f"{first_row.casher.user.name} {first_row.casher.user.last_name}",
        "created_at": first_row.created_at,
        "items": sales,  # Pydantic se encarga de convertir OrderProduct -> TicketItemRead
        "grand_total": sum(float(sale.total) for sale in sales),
    }
