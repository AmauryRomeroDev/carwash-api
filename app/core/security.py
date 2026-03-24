import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
import os

# Configuración de JWT
SECRET_KEY = os.getenv("SECRET_KEY", "tu_clave_secreta_aqui")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('TOKEN_EXPIRE_MINUTES', 15))

def get_password_hash(password: str) -> str:
    """Genera un hash usando bcrypt directo"""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara texto plano con el hash de la DB"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(
    user_id: int, 
    user_type: str, 
    role: Optional[str] = None, 
    expires_delta: Optional[timedelta] = None  # <--- Agregamos este parámetro
):
    # 1. Calcular el tiempo de expiración
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Tiempo por defecto (30 min) si no se envía nada
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 2. Preparar el contenido del token 
    to_encode = {
        "sub": str(user_id),
        "type": user_type,
        "role": role,
        "exp": expire
    }
    
    # 3. Firmar y retornar el JWT
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
