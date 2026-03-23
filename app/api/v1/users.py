# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/me")
async def get_current_user_data(current_user: User = Depends(get_current_user)):
    # current_user ya es el objeto de SQLAlchemy con sus relaciones
    
    # Preparamos la respuesta según el tipo
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
