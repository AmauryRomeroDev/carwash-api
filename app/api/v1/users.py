# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.models.order_service import OrderService
from app.models.order_product import OrderProduct
from app.models.service import Service
from app.models.product import Product
from app.schemas.user import UserUpdate, UserRead
from app.core.security import get_password_hash
from app.models.session import UserSession
from app.schemas.order_service import  OrderServiceRead
router = APIRouter()

# Read ------------
@router.get("/me")
async def get_current_user_data(current_user: User = Depends(get_current_user)):
    response = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "type": current_user.type,
    }
    
    if current_user.type == "employee" and current_user.employee:
        response["role"] = current_user.employee.role
    elif current_user.type == "client" and current_user.client:
        response["address"] = current_user.client.address
        
    return response
# Update -----------
@router.patch("/me", response_model=UserRead)
def update_own_profile(
    data: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Traemos al objeto a la sesión actual
    current_user = db.merge(current_user)
    
    # Extraemos solo lo que el usuario envió en el JSON
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        # 1. Filtro para Strings (Limpiar espacios y evitar el valor por defecto 'string')
        if isinstance(value, str):
            clean_value = value.strip()
            
            # Si es solo espacios ("  ") o es el texto "string" de Swagger, lo ignoramos
            if not clean_value or clean_value.lower() == "string":
                continue
            value = clean_value

        # 2. Hashing de contraseña (solo si pasó el filtro anterior)
        if key == "password":
            value = get_password_hash(value)
        
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


# Delete for admin ------------
allow_admin = RoleChecker(["admin"])

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(allow_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.is_active = False
    db.commit()
    return None

# Logout -----------------------------------------------------
@router.post("/logout")
def logout(
    request: Request, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Usamos el token que el middleware inyectó en request.state
    token = getattr(request.state, "token", None)

    session = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.token == token,
        UserSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada o ya cerrada")

    session.is_active = False
    db.commit()
    return {"detail": "Sesión cerrada exitosamente"}

# Delete user (desactivate profile) -----------------
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_my_account(
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Traemos al objeto a la sesión actual
    current_user = db.merge(current_user)
    current_user.is_active = False

    # 2. También cerramos su sesión actual para que sea expulsado inmediatamente
    token = getattr(request.state, "token", None)
    session = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.token == token
    ).first()
    
    if session:
        session.is_active = False

    db.commit()
    return None
 # Show products and services of the user -----------------
@router.get("/my-purchase-history", status_code=status.HTTP_200_OK)
async def get_my_purchase_history(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el historial de servicios solicitados y productos comprados
    por el usuario autenticado.
    """
    # 1. Validar que el usuario sea de tipo cliente y tenga perfil asociado
    if current_user.type != "client" or not current_user.client:
        raise HTTPException(
            status_code=403, 
            detail="Solo los clientes tienen un historial de compras personal."
        )
    
    client_id = current_user.client.id

    # 2. Consultar Servicios (con carga de relación al nombre del servicio)
    services = (
        db.query(OrderService)
        .options(joinedload(OrderService.service))
        .filter(OrderService.client_id == client_id)
        .order_by(OrderService.created_at.desc())
        .all()
    )

    # 3. Consultar Productos
    products = (
        db.query(OrderProduct)
        .options(joinedload(OrderProduct.product))
        .filter(OrderProduct.client_id == client_id)
        .order_by(OrderProduct.created_at.desc())
        .all()
    )

    # 4. Formatear respuesta
    return {
        "services": [
            {
                "id": s.id,
                "ticket_id": s.ticket_id,
                "service_name": s.service.service_name if s.service else "N/A",
                "date": s.created_at,
                "total": float(s.subtotal),
                "status": "Completado" if s.completion_time else "En proceso",
                "notes": s.notes
            } for s in services
        ],
        "products": [
            {
                "id": p.id,
                "ticket_id": p.ticket_id,
                "product_name": p.product.name if p.product else "N/A",
                "amount": p.amount,
                "date": p.created_at,
                "total": float(p.subtotal)
            } for p in products
        ]
    }