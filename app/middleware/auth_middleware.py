# app/middlewares/auth_middleware.py
import os
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from app.models.session import UserSession
from app.database.connection import SessionLocal

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rutas públicas
        EXCLUDED_PATHS = [
            "/api/v1/auth/login",
            "/api/v1/auth/register/client",
            "/api/v1/auth/register/employee",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
        PUBLIC_GET_PATHS = [
            "/api/v1/products",
            "/api/v1/services",
            "/api/v1/comments"
        ]
    # Lógica de exclusión
        is_excluded = any(request.url.path.startswith(p) for p in EXCLUDED_PATHS)
        is_public_get = request.method == "GET" and any(request.url.path.startswith(p) for p in PUBLIC_GET_PATHS)

        if is_excluded or is_public_get:
            return await call_next(request)

        # 2. Obtener y validar el header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Token de autenticación faltante"}, 401)

        token = auth_header.split(" ")[1]

        try:
            # 3. Decodificar Token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            request.state.token=token
            
            db = SessionLocal()
            session_db = db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.token == token, # El token debe ser idéntico al guardado
                UserSession.is_active == True
            ).first()
            db.close()

            if user_id is None:
                return JSONResponse({"detail": "Token inválido: sub missing"}, 401)

            # 4. Inyectar info en el 'state'
            request.state.user_id = user_id
            request.state.user_type = payload.get("type")
            request.state.user_role = payload.get("role")

        except JWTError:
            return JSONResponse({"detail": "Token expirado o corrupto"}, 401)
 
        return await call_next(request)
