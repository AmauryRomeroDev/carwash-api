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

class MovementTypeEnum(enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])


# --- MOVIMIENTOS MANUALES DE ALMACÉN ---

# Get by type -----------------------------
@router.get("/inventory/movements", response_model=List[InventoryMovementRead])
def get_inventory_movements(
    move_type: str = None,  # Opcional: "in", "out" o "adjustment"
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    query = db.query(InventoryMovement).options(
        joinedload(InventoryMovement.product),
        joinedload(InventoryMovement.employee).joinedload(Employee.user)
    )
    
    if move_type:
        query = query.filter(InventoryMovement.type == move_type.upper())
    
    return query.order_by(InventoryMovement.id.desc()).all()

# Get by ID -------------------------------
@router.get("/inventory/movements/{move_id}", response_model=InventoryMovementRead)
def get_movement_by_id(
    move_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    move = db.query(InventoryMovement).options(
        joinedload(InventoryMovement.product),
        joinedload(InventoryMovement.employee).joinedload(Employee.user)
    ).filter(InventoryMovement.id == move_id).first()

    if not move:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return move

# Create movement -------------------------
@router.post("/inventory/movements", response_model=InventoryMovementRead)
def manual_inventory_adjust(
    data: InventoryMovementCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_admin)
):
    
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="El usuario no tiene perfil de empleado asiciado")
    
    real_employee_id = current_user.employee.id
    
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
        employee_id=real_employee_id,
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

# Update movement ------------------------------
from app.schemas.inventory_movements import InventoryMovementUpdate

@router.patch("/inventory/movements/{move_id}", response_model=InventoryMovementRead)
def update_inventory_movement(
    move_id: int,
    data: InventoryMovementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    move = db.query(InventoryMovement).filter(InventoryMovement.id == move_id).first()
    if not move:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    product = db.query(Product).filter(Product.id == move.product_id).first()
    update_data = data.model_dump(exclude_unset=True)

    # Lógica de re-ajuste de Stock si cambia Amount o Type
    if "amount" in update_data or "type" in update_data:
        # 1. Revertir el stock actual (si era IN, restamos; si era OUT, sumamos)
        if move.type == "IN":
            product.stock -= move.amount
        else:
            product.stock += move.amount
        
        # 2. Aplicar el nuevo valor
        new_amount = update_data.get("amount", move.amount)
        new_type = update_data.get("type", move.type).upper()
        
        if new_type == "IN":
            product.stock += new_amount
        else:
            if product.stock < new_amount:
                db.rollback()
                raise HTTPException(status_code=400, detail="Stock insuficiente para este cambio")
            product.stock -= new_amount
        
        update_data["type"] = new_type

    # Aplicar cambios al registro
    for key, value in update_data.items():
        if isinstance(value, str) and value.lower() == "string":
            continue
        setattr(move, key, value)

    db.commit()
    db.refresh(move)
    return move
