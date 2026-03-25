from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from app.database.connection import get_db
from app.core.dependencies import RoleChecker, get_current_user

from app.models.user import User
from app.models.product import Product
from app.models.order_service import OrderService
from app.models.order_product import OrderProduct
from app.models.inventory_movements import InventoryMovement
from app.models.employee import Employee

# Esquemas
from app.schemas.inventory_movements import InventoryMovementCreate, InventoryMovementRead
from app.schemas.order_service import OrderServiceCreate, OrderServiceRead
from app.schemas.order_product import OrderProductCreate
from sqlalchemy.orm import joinedload

import enum

class MovementTypeEnum(enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"

router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])

# --- DASHBOARD & STATS ---
@router.get("/dashboard/stats", dependencies=[Depends(allow_admin)])
def get_admin_stats(db: Session = Depends(get_db)):
    total_sales = db.query(func.sum(OrderService.subtotal)).scalar() or 0
    pending_orders = db.query(OrderService).filter(OrderService.is_active == True).count()
    low_stock_products = db.query(Product).filter(Product.stock < 5).count()
    
    return {
        "total_revenue": float(total_sales),
        "active_orders": pending_orders,
        "low_stock_alerts": low_stock_products
    }

# --- GESTIÓN DE ÓRDENES (SERVICIOS) ---
@router.post("/orders", response_model=OrderServiceRead, status_code=status.HTTP_201_CREATED)
def create_staff_order(
    data: OrderServiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    # El casher_id siempre es el empleado loggeado
    new_order = OrderService(
        **data.model_dump(exclude={"casher_id"}),
        casher_id=current_user.id
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# --- VENTA DE PRODUCTOS & INVENTARIO ---
@router.post("/orders/products", status_code=status.HTTP_201_CREATED)
def add_product_to_order(
    data: OrderProductCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_staff)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    
    if not product or product.stock < data.amount:
        raise HTTPException(status_code=400, detail="Stock insuficiente o producto no existe")

    # 1. Registrar el producto en la orden
    new_item = OrderProduct(**data.model_dump(exclude={"casher_id"}), casher_id=current_user.id)
    
    # 2. Descontar stock físicamente
    product.stock -= data.amount
    
    # 3. Registrar el movimiento de salida (OUT)
    movement = InventoryMovement(
        product_id=data.product_id,
        type="out",
        amount=data.amount,
        employee_id=current_user.id,
        order_id=data.order_id,
        note=f"Venta en orden #{data.order_id}"
    )
    
    db.add(new_item)
    db.add(movement)
    db.commit()
    return {"message": "Producto añadido y stock actualizado", "stock_restante": product.stock}

# --- MOVIMIENTOS MANUALES DE ALMACÉN ---
@router.post("/inventory/movements", response_model=InventoryMovementRead)
def manual_inventory_adjust(
    data: InventoryMovementCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_admin)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if data.type == "in":
        product.stock += data.amount
    elif data.type == "out":
        if product.stock < data.amount:
            raise HTTPException(status_code=400, detail="No hay suficiente stock para retirar")
        product.stock -= data.amount

    try:
        db_type = MovementTypeEnum[data.type.value.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Tipo de movimiento no válido")


    new_move = InventoryMovement(
        product_id=data.product_id,
        employee_id=current_user.id,
        order_id=data.order_id if data.order_id != 0 else None,
        type=db_type.value,
        amount=data.amount,
        note=data.note
    )
    db.add(new_move)
    db.commit()
    
    # CARGA EN CASCADA: Movimiento -> Empleado -> Usuario
    result = db.query(InventoryMovement).options(
        joinedload(InventoryMovement.product),
        joinedload(InventoryMovement.employee).joinedload(Employee.user)
    ).filter(InventoryMovement.id == new_move.id).first()

    return result
