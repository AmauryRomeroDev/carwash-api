from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentMainResponse

router = APIRouter()

# --- CREATE (Cualquier usuario loggeado) ---
@router.post("/", response_model=CommentMainResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    data: CommentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Validar que si es una respuesta, el padre exista
    if data.parent_id:
        parent = db.query(Comment).filter(Comment.id == data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="El comentario original no existe")

    new_comment = Comment(
        content=data.content,
        author_id=current_user.id, # El autor siempre es el usuario actual
        service_id=data.service_id,
        rating=data.rating,
        parent_id=data.parent_id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
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
