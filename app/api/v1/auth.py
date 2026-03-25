# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from datetime import timedelta
from app.models.user import User
from app.models.employee import Employee
from app.models.client import Client
from app.schemas.employee import EmployeeCreate
from app.schemas.client import ClientCreate
from app.schemas.auth import LoginRequest
from app.models.session import UserSession
from app.core.security import get_password_hash, verify_password, create_access_token

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally: 
        db.close()

router = APIRouter()

@router.post("/register/employee", status_code=status.HTTP_201_CREATED)
def register_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    
    new_user = User(
        name=data.name,
        last_name=data.last_name,
        second_last_name=data.second_last_name,
        phone_number=data.phone, 
        email=data.email,
        password=get_password_hash(data.password),
        type="employee"
    )
    db.add(new_user)
    db.flush() 

    new_employee = Employee(
        user_id=new_user.id,
        role=data.role
    )
    db.add(new_employee)
    db.commit()
    return {"message": "Empleado registrado con éxito"}

@router.post("/register/client", status_code=status.HTTP_201_CREATED)
def register_client(data: ClientCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    # En ClientCreate, heredas de UserMinimalRead o UserBase
    # Asegúrate de capturar todos los campos necesarios para el modelo User
    new_user = User(
        name=data.name,
        last_name=data.last_name,
        second_last_name=data.second_last_name,
        phone_number=data.phone,
        email=data.email,
        password=get_password_hash(data.password), # Si el cliente crea cuenta con pass
        type="client"
    )
    db.add(new_user)
    db.flush()

    new_client = Client(
        user_id=new_user.id,
        address=data.address
    )
    db.add(new_client)
    db.commit()
    return {"message": "Cliente registrado con éxito"}

@router.post("/login")
def login(data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.username).first()
    
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciales inválidas"
        )

    # Lógica de roles para el token
    role = user.employee.role if user.type == "employee" and user.employee else None
    expires = timedelta(days=365) if user.type == "client" else timedelta(days=1)
    
    token = create_access_token(
        user_id=user.id,
        user_type=user.type,
        role=role,
        expires_delta=expires
    )
    # --- Lógica de Sesión Persistente (Upsert) ---
    session = db.query(UserSession).filter(UserSession.user_id == user.id).first()
    if session:
        session.token = token
        session.is_active = True
    else:
        new_session = UserSession(user_id=user.id, token=token)
        db.add(new_session)
    
    db.commit()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "type": user.type,
            "role": role,
            "name": user.name
        }
    }
