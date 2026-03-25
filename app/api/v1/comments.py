from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.comment import Comment
from app.models.user import User
from app.models.service import Service
from app.schemas.comment import CommentCreate, CommentMainResponse, CommentUpdate,CommentReplyResponse

router = APIRouter()

# --- CREATE (Comentarios) ---
@router.post("/", response_model=CommentMainResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    data: CommentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    #  Limpiar IDs (0 a None)
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

    new_comment = Comment(
        content=data.content,
        author_id=current_user.id,
        service_id=s_id, # Usamos el ID limpio
        rating=data.rating,
        parent_id=p_id   # Usamos el ID limpio (None si era 0)
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
  #  if new_comment.replies is None:
   #     new_comment.replies = []
    return new_comment


# --- READ (Público: Ver todos los comentarios principales con sus respuestas) ---
@router.get("/", response_model=List[CommentMainResponse])
def get_comments(db: Session = Depends(get_db)):
    """Obtiene los comentarios principales (sin padre) y sus respuestas"""
    comments = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.service),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(Comment.parent_id == None).all() # Solo comentarios raíz
    
    return comments

# --- DELETE (Dueño del comentario o Admin) ---
@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    is_admin = current_user.type == "employee" and current_user.employee.role == "admin"
    if not is_admin and comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes borrar este comentario")

    db.delete(comment)
    db.commit()
    return None

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

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(comment, key, value)

    db.commit()
    db.refresh(comment)
    return comment
