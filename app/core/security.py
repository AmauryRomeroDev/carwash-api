from datetime import datetime, timedelta
from jose import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv('TOKEN_EXPIRE_MINUTES')

def create_access_token(user_id: int, user_type: str, role: str = None):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Informacion que el Middleware leerá
    to_encode = {
        "sub": str(user_id),
        "type": user_type,
        "role": role,
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
