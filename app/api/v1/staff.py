from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db # Asegúrate de que apunte a tu generador de DB
from app.core.dependencies import RoleChecker, get_current_user
from app.models.user import User

router = APIRouter()

# Definimos quién tiene permiso (ajusta los roles según tu tabla 'roles')
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])

@router.get("/dashboard/stats", dependencies=[Depends(allow_admin)])
def get_admin_stats(db: Session = Depends(get_db)):
    # Aquí iría tu lógica de negocio (conteo de servicios, ventas, etc.)
    return {"stats": "Datos privados de administración"}

@router.get("/services/pending", dependencies=[Depends(allow_staff)])
def get_pending_services(db: Session = Depends(get_db)):
    # Esta ruta la ven tanto admins como empleados comunes
    return {"services": "Lista de servicios por lavar"}
