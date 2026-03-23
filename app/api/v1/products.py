from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.product import Product # Asegúrate de que el modelo use 'unit_price' y 'stock'
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter()

# Permiso: Solo Administradores
allow_admin = RoleChecker(["admin"])

# --- READ ALL ---
@router.get("/", response_model=List[ProductRead])
def list_products(db: Session = Depends(get_db)):
    """Lista todos los productos disponibles en el inventario"""
    return db.query(Product).all()
# READ ONE -----------------------------
@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle de un producto específico"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

# --- CREATE (Solo Admin) ---
@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate, 
    db: Session = Depends(get_db), 
    _=Depends(allow_admin)
):
    # Verificar si ya existe un producto con el mismo nombre
    if db.query(Product).filter(Product.name == data.name).first():
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese nombre")
    
    new_product = Product(**data.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# --- UPDATE (Solo Admin) ---
@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int, 
    data: ProductUpdate, 
    db: Session = Depends(get_db), 
    _=Depends(allow_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # model_dump(exclude_unset=True) para actualizar solo lo enviado en el JSON
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product

# --- DELETE (Solo Admin) ---
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db), 
    _=Depends(allow_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # En productos, puedes elegir borrado físico o agregar un campo 'is_active'
    db.delete(product)
    db.commit()
    return None
