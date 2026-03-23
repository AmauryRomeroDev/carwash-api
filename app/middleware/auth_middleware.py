import os
from dotenv import load_dotenv
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from ..models.user import User

SECRET_KEY = f"{os.getenv('SECRET_KEY')}"
ALGORITHM = f"{os.getenv('ALGORITHM')}"


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Rutas que no requieren autenticación
        EXCLUDED_PATHS = [
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/docs",
            "/openapi.json",
        ]
        if request.url.path in EXCLUDED_PATHS:
            return await call_next(request)

        # Obtener el token del Header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return self._error_response("Token de autenticación faltante", 401)

        token = auth_header.split(" ")[1]

        try:
            # Decodificar Token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_email: str = payload.get("sub")
            if user_email is None:
                return self._error_response("Token inválido", 401)

            # Validar usuario en BD
            db = SessionLocal()
            user = db.query(User).filter(User.email == user_email).first()
            db.close()

            if user is None:
                return self._error_response("Usuario no encontrado", 401)

            # Inyectar el usuario en el 'state' de la petición
            request.state.user = user

        except JWTError:
            return self._error_response("Token expirado o corrupto", 401)

        return await call_next(request)

    def _error_response(self, message: str, status_code: int):
        from fastapi.responses import JSONResponse

        return JSONResponse(content={"detail": message}, status_code=status_code)
