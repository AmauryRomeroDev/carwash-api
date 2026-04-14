# app/api/v1/staff.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import json

from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.models.employee import Employee
from app.core.security import get_password_hash
from app.schemas.employee import EmployeeCreate, EmployeeRead, EmployeeUpdate

router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])

# ==================== ENDPOINTS ====================

@router.get("/", response_model=List[EmployeeRead])
def get_all_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    employees = (
        db.query(Employee)
        .options(joinedload(Employee.user))
        .all()
    )

    results = []
    for emp in employees:
        day_labor = emp.day_labor
        if isinstance(day_labor, str):
            try:
                day_labor = json.loads(day_labor)
            except:
                day_labor = None
                
        results.append({
            "id": emp.id,
            "role": emp.role,
            "day_labor": day_labor,
            "is_active": emp.is_active,
            "created_at": emp.created_at,
            "updated_at": emp.updated_at,
            "name": emp.user.name,
            "last_name": emp.user.last_name,
            "second_last_name": emp.user.second_last_name,
            "phone": emp.user.phone_number,
            "email": emp.user.email,
            "photo_url": emp.user.photo_url,
        })

    return results


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee_by_id(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    day_labor = employee.day_labor
    if isinstance(day_labor, str):
        try:
            day_labor = json.loads(day_labor)
        except:
            day_labor = None
    
    return {
        "id": employee.id,
        "role": employee.role,
        "day_labor": day_labor,
        "is_active": employee.is_active,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
        "name": employee.user.name,
        "last_name": employee.user.last_name,
        "second_last_name": employee.user.second_last_name,
        "phone": employee.user.phone_number,
        "email": employee.user.email,
        "photo_url": employee.user.photo_url,
    }


@router.post("/", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    # Verificar si el email ya está registrado
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Crear usuario
    new_user = User(
        name=data.name,
        last_name=data.last_name,
        second_last_name=data.second_last_name,
        email=data.email,
        phone_number=data.phone,
        password=get_password_hash(data.password),
        type="employee",
        is_active=True
    )
    db.add(new_user)
    db.flush() 
    
    # Crear empleado
    new_employee = Employee(
        user_id=new_user.id,
        role=data.role,
        day_labor=json.dumps(data.day_labor) if data.day_labor else None,
        is_active=True
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return {
        "id": new_employee.id,
        "role": new_employee.role,
        "day_labor": data.day_labor,
        "is_active": new_employee.is_active,
        "created_at": new_employee.created_at,
        "updated_at": new_employee.updated_at,
        "name": new_user.name,
        "last_name": new_user.last_name,
        "second_last_name": new_user.second_last_name,
        "phone": new_user.phone_number,
        "email": new_user.email,
        "photo_url": new_user.photo_url,
    }


@router.patch("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    
    # Actualizar campos del Usuario vinculado
    user_fields = ["name", "last_name", "second_last_name", "email", "phone", "password"]
    for field in user_fields:
        if field in update_data:
            val = update_data[field]
            if field == "phone":
                employee.user.phone_number = val
            elif field == "password" and val:
                employee.user.password = get_password_hash(val)
            else:
                setattr(employee.user, field, val)
    
    # Actualizar campos del Empleado
    if "role" in update_data:
        employee.role = update_data["role"]
    if "day_labor" in update_data:
        employee.day_labor = json.dumps(update_data["day_labor"]) if update_data["day_labor"] else None
    if "is_active" in update_data:
        employee.is_active = update_data["is_active"]
        employee.user.is_active = update_data["is_active"]
    
    db.commit()
    db.refresh(employee)
    
    day_labor = employee.day_labor
    if isinstance(day_labor, str):
        try:
            day_labor = json.loads(day_labor)
        except:
            day_labor = None
    
    return {
        "id": employee.id,
        "role": employee.role,
        "day_labor": day_labor,
        "is_active": employee.is_active,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
        "name": employee.user.name,
        "last_name": employee.user.last_name,
        "second_last_name": employee.user.second_last_name,
        "phone": employee.user.phone_number,
        "email": employee.user.email,
        "photo_url": employee.user.photo_url,
    }


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    employee.is_active = False
    if employee.user:
        employee.user.is_active = False
    
    db.commit()
    return None


@router.patch("/{employee_id}/reactivate", response_model=EmployeeRead)
def reactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    employee.is_active = True
    if employee.user:
        employee.user.is_active = True
    
    db.commit()
    db.refresh(employee)
    
    day_labor = employee.day_labor
    if isinstance(day_labor, str):
        try:
            day_labor = json.loads(day_labor)
        except:
            day_labor = None
    
    return {
        "id": employee.id,
        "role": employee.role,
        "day_labor": day_labor,
        "is_active": employee.is_active,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
        "name": employee.user.name,
        "last_name": employee.user.last_name,
        "second_last_name": employee.user.second_last_name,
        "phone": employee.user.phone_number,
        "email": employee.user.email,
        "photo_url": employee.user.photo_url,
    }


@router.get("/active/", response_model=List[EmployeeRead])
def get_active_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    employees = (
        db.query(Employee)
        .options(joinedload(Employee.user))
        .filter(Employee.is_active == True)
        .all()
    )
    
    results = []
    for emp in employees:
        day_labor = emp.day_labor
        if isinstance(day_labor, str):
            try:
                day_labor = json.loads(day_labor)
            except:
                day_labor = None
                
        results.append({
            "id": emp.id,
            "role": emp.role,
            "day_labor": day_labor,
            "is_active": emp.is_active,
            "created_at": emp.created_at,
            "updated_at": emp.updated_at,
            "name": emp.user.name,
            "last_name": emp.user.last_name,
            "second_last_name": emp.user.second_last_name,
            "phone": emp.user.phone_number,
            "email": emp.user.email,
            "photo_url": emp.user.photo_url,
        })
    
    return results


@router.get("/role/{role}", response_model=List[EmployeeRead])
def get_employees_by_role(
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    employees = (
        db.query(Employee)
        .options(joinedload(Employee.user))
        .filter(Employee.role == role)
        .all()
    )
    
    results = []
    for emp in employees:
        day_labor = emp.day_labor
        if isinstance(day_labor, str):
            try:
                day_labor = json.loads(day_labor)
            except:
                day_labor = None
                
        results.append({
            "id": emp.id,
            "role": emp.role,
            "day_labor": day_labor,
            "is_active": emp.is_active,
            "created_at": emp.created_at,
            "updated_at": emp.updated_at,
            "name": emp.user.name,
            "last_name": emp.user.last_name,
            "second_last_name": emp.user.second_last_name,
            "phone": emp.user.phone_number,
            "email": emp.user.email,
            "photo_url": emp.user.photo_url,
        })
    
    return results


@router.get("/me/profile", response_model=EmployeeRead)
def get_my_employee_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.type != "employee":
        raise HTTPException(status_code=403, detail="No eres un empleado")
    
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Perfil de empleado no encontrado")
    
    day_labor = employee.day_labor
    if isinstance(day_labor, str):
        try:
            day_labor = json.loads(day_labor)
        except:
            day_labor = None
    
    return {
        "id": employee.id,
        "role": employee.role,
        "day_labor": day_labor,
        "is_active": employee.is_active,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
        "name": employee.user.name,
        "last_name": employee.user.last_name,
        "second_last_name": employee.user.second_last_name,
        "phone": employee.user.phone_number,
        "email": employee.user.email,
        "photo_url": employee.user.photo_url,
    }


@router.patch("/me/profile", response_model=EmployeeRead)
def update_my_employee_profile(
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.type != "employee":
        raise HTTPException(status_code=403, detail="No eres un empleado")
    
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Perfil de empleado no encontrado")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Solo permitir actualizar teléfono y contraseña
    if "phone" in update_data:
        employee.user.phone_number = update_data["phone"]
    if "password" in update_data and update_data["password"]:
        employee.user.password = get_password_hash(update_data["password"])
    
    db.commit()
    db.refresh(employee)
    
    day_labor = employee.day_labor
    if isinstance(day_labor, str):
        try:
            day_labor = json.loads(day_labor)
        except:
            day_labor = None
    
    return {
        "id": employee.id,
        "role": employee.role,
        "day_labor": day_labor,
        "is_active": employee.is_active,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
        "name": employee.user.name,
        "last_name": employee.user.last_name,
        "second_last_name": employee.user.second_last_name,
        "phone": employee.user.phone_number,
        "email": employee.user.email,
        "photo_url": employee.user.photo_url,
    }