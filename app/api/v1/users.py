# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.schemas.user import UserUpdate, UserRead
from app.core.security import get_password_hash

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
    # Convertimos a dict saltando los valores no enviados (unset)
    update_data = data.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])
    
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

# Delete user (desactivate profile) -----------------
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_my_account(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Borrado lógico
    current_user.is_active = False

    db.commit()
    

    return None

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
