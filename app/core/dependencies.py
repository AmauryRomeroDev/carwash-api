from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import joinedload
from app.database.connection import SessionLocal
from app.models.user import User

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_current_user(request: Request, db: SessionLocal = Depends(get_db)):
    user_id = request.state.user_id # Viene del middleware
    # Usamos joinedload para traer el perfil
    user = db.query(User).options(
        joinedload(User.employee), 
        joinedload(User.client)
    ).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        # Si es cliente y la ruta pide roles de staff
        if user.type == "client" and "client" not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Acceso denegado a clientes")
            
        # Si es empleado, verificamos su rol específico
        if user.type == "employee":
            if user.employee.role not in self.allowed_roles:
                raise HTTPException(status_code=403, detail="No tienes permisos de staff suficientes")
        
        return user

