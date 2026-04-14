from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

# Asumiendo que User es tu esquema de usuario
from app.models.user import User

router = APIRouter()

allow_admin = RoleChecker(["admin"])


# --- READ ALL (Público) ---
@router.get("/", response_model=List[ProductRead])
def list_products(db: Session = Depends(get_db)):
    """Cualquiera puede ver la lista de productos"""
    return db.query(Product).all()


# READ ONE (Público)
@router.get("/{product_id}", response_model=ProductRead) # Sin List[]
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


# --- CREATE (Privado - Solo Admin) ---
@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # Valida token
    _=Depends(allow_admin),  # Valida rol
):
    if db.query(Product).filter(Product.product_name == data.product_name).first():
        raise HTTPException(
            status_code=400, detail="Ya existe un producto con ese nombre"
        )

    new_product = Product(**data.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


# --- UPDATE (Solo Admin) ---
@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(allow_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # 1. Extraer solo campos enviados
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        # 2. Filtro de limpieza (evitar sobreescribir con basura)
        if isinstance(value, str):
            clean_value = value.strip()
            if clean_value.lower() == "string" or not clean_value:
                continue
            value = clean_value

        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product

# --- DELETE (Solo Admin) ---
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(allow_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(product)
    db.commit()
    return None
