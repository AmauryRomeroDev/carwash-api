# app/api/v1/comments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database.connection import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.comment import Comment
from app.models.user import User
from app.models.service import Service
from app.schemas.comment import CommentCreate, CommentMainResponse, CommentUpdate

router = APIRouter()

# Permisos
allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "employee"])


# --- CREATE (Comentarios) - Requiere autenticación ---
@router.post("/", response_model=CommentMainResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    data: CommentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Limpiar IDs (0 a None)
    p_id = data.parent_id if data.parent_id != 0 else None
    s_id = data.service_id if data.service_id != 0 else None

    # Validar que el servicio exista (si se proporcionó uno)
    if s_id:
        service_exists = db.query(Service).filter(Service.id == s_id).first()
        if not service_exists:
            raise HTTPException(status_code=400, detail="El servicio especificado no existe")

    # Validar que si es una respuesta, el padre exista
    if p_id:
        parent = db.query(Comment).filter(Comment.id == p_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="El comentario original no existe")

    # Determinar si el comentario debe aprobarse automáticamente
    # Si el usuario es admin o staff, el comentario se aprueba automáticamente
    is_staff = current_user.type == "employee" and current_user.employee
    auto_approve = is_staff and current_user.employee.role in ["admin", "employee"]
    
    new_comment = Comment(
        content=data.content,
        author_id=current_user.id,
        service_id=s_id,
        rating=data.rating or 0,
        parent_id=p_id,
        is_active=True,
        is_approved=auto_approve  # Staff: True, Cliente: False
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return new_comment


# --- READ ALL COMMENTS (PÚBLICO - No requiere autenticación) ---
@router.get("/", response_model=List[CommentMainResponse])
def get_comments(
    db: Session = Depends(get_db)
):
    """
    Obtiene los comentarios públicos aprobados.
    No requiere autenticación.
    Solo muestra comentarios aprobados y activos.
    """
    comments = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.service),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(
        Comment.parent_id == None,
        Comment.is_approved == True,
        Comment.is_active == True
    ).all()
    
    return comments


# --- READ ALL COMMENTS (ADMIN - Requiere autenticación) ---
@router.get("/admin", response_model=List[CommentMainResponse])
def get_all_comments_admin(
    include_pending: bool = True,  # Por defecto incluir pendientes
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene todos los comentarios (incluyendo pendientes y eliminados).
    Verifica manualmente que el usuario sea admin o staff.
    """
    # Verificar que el usuario sea admin o staff
    if current_user.type != "employee":
        raise HTTPException(status_code=403, detail="No eres empleado")
    
    if not current_user.employee:
        raise HTTPException(status_code=403, detail="No tienes perfil de empleado")
    
    # Construir query base
    query = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.service),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(Comment.parent_id == None)
    
    # Filtrar por aprobados si no se quieren pendientes
    if not include_pending:
        query = query.filter(Comment.is_approved == True)
    
    # Ordenar por fecha más reciente
    query = query.order_by(Comment.created_at.desc())
    
    return query.all()


# --- READ ALL COMMENTS (STAFF) ---
@router.get("/staff", response_model=List[CommentMainResponse])
def get_all_comments_staff(
    include_pending: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    """
    Obtiene todos los comentarios para staff.
    Similar al admin pero con permisos de staff.
    """
    query = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.service),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(Comment.parent_id == None)
    
    if not include_pending:
        query = query.filter(Comment.is_approved == True)
    
    query = query.order_by(Comment.created_at.desc())
    
    return query.all()


# --- Read only my comments (Requiere autenticación) ---
@router.get("/me", response_model=List[CommentMainResponse])
def get_my_comments(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Obtiene los comentarios principales creados por el usuario actual"""
    my_comments = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.service),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(
        Comment.author_id == current_user.id,
        Comment.parent_id == None
    ).order_by(Comment.created_at.desc()).all()
    
    return my_comments


# --- Get comment by id ---
@router.get("/{comment_id}", response_model=CommentMainResponse)
def get_comment_by_id(
    comment_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Obtiene un comentario por su ID.
    Si es público y está aprobado, cualquiera puede verlo.
    Si no está aprobado, solo el dueño, admin o staff pueden verlo.
    """
    comment = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.service),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"El comentario con ID {comment_id} no existe"
        )
    
    # Si el comentario está aprobado y activo, cualquiera puede verlo
    if comment.is_approved and comment.is_active:
        return comment
    
    # Si no está aprobado, verificar permisos
    is_admin_or_staff = False
    if current_user:
        is_admin_or_staff = current_user.type in ["admin", "employee"]
    
    if not is_admin_or_staff and (not current_user or comment.author_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este comentario"
        )
    
    return comment


# --- Update comment (solo dueño) ---
@router.patch("/{comment_id}", response_model=CommentMainResponse)
def update_comment(
    comment_id: int, 
    data: CommentUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    # Seguridad: Solo el dueño puede editar
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes editar un comentario que no es tuyo")
    
    # No se puede editar si está inactivo
    if not comment.is_active:
        raise HTTPException(status_code=400, detail="No se puede editar un comentario eliminado")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(comment, key, value)

    db.commit()
    db.refresh(comment)
    return comment


# --- Approve comment (solo admin/staff) ---
@router.patch("/{comment_id}/approve", response_model=CommentMainResponse)
def approve_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    """
    Aprueba un comentario para que sea visible públicamente.
    Solo accesible para administradores y staff.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    if not comment.is_active:
        raise HTTPException(status_code=400, detail="No se puede aprobar un comentario eliminado")
    
    comment.is_approved = True
    db.commit()
    db.refresh(comment)
    
    return comment


# --- Reject comment (solo admin/staff) ---
@router.patch("/{comment_id}/reject", response_model=CommentMainResponse)
def reject_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    """
    Rechaza un comentario (no será visible públicamente).
    Solo accesible para administradores y staff.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    comment.is_approved = False
    db.commit()
    db.refresh(comment)
    
    return comment


# --- Delete comment (borrado lógico - solo admin/staff) ---
@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    """
    Elimina lógicamente un comentario (is_active = False).
    Solo accesible para administradores y staff.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    comment.is_active = False
    db.commit()
    
    return None


# --- Hard delete comment (solo admin) ---
@router.delete("/{comment_id}/hard", status_code=status.HTTP_204_NO_CONTENT)
def hard_delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    """
    Elimina físicamente un comentario de la base de datos.
    Solo accesible para administradores.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    db.delete(comment)
    db.commit()
    
    return None


# --- Get pending comments (solo admin/staff) ---
@router.get("/pending/", response_model=List[CommentMainResponse])
def get_pending_comments(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    """
    Obtiene todos los comentarios pendientes de aprobación.
    Solo accesible para administradores y staff.
    """
    pending_comments = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.service),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(
        Comment.is_approved == False,
        Comment.is_active == True,
        Comment.parent_id == None
    ).order_by(Comment.created_at.desc()).all()
    
    return pending_comments


# --- Restore comment (solo admin/staff) ---
@router.patch("/{comment_id}/restore", response_model=CommentMainResponse)
def restore_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_staff)
):
    """
    Restaura un comentario eliminado lógicamente (is_active = True).
    Solo accesible para administradores y staff.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    comment.is_active = True
    db.commit()
    db.refresh(comment)
    
    return comment