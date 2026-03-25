#dependences.py
from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session 
from app.database.connection import SessionLocal
from app.models.session import UserSession
from app.models.user import User
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()


def get_current_user(request: Request, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    user_id = getattr(request.state, "user_id", None) 
    token = getattr(request.state, "token", None)
    
    if not user_id or not token:
        raise HTTPException(status_code=401, detail="No se encontró información de sesión")

    db_session = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.token == token,
        UserSession.is_active == True
    ).first()
    
    if not db_session:
        raise HTTPException(status_code=401, detail="Sesión inválida o cerrada")

    user = db.query(User).options(
        joinedload(User.employee), 
        joinedload(User.client)
    ).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="La cuenta está desactivada"
        )
        
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

