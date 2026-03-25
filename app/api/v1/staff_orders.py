from app.models.user import User
from app.schemas.order_product import OrderProductCreate, OrderProductRead,OrderProductUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from decimal import Decimal
import enum

from app.database.connection import get_db
from app.core.dependencies import RoleChecker, get_current_user

from app.models.user import User
from app.models.product import Product

from app.models.order_product import OrderProduct
from app.models.inventory_movements import InventoryMovement
from app.models.employee import Employee


# Esaquemas
from app.schemas.order_product import OrderProductCreate
from sqlalchemy.orm import joinedload
from app.schemas.inventory_movements import InventoryMovementCreate, InventoryMovementRead



router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])

# Create order ----------------------------------------
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
        subtotal=subtotal,
        total=total_final
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
