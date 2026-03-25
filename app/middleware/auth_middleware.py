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
        # 1. Rutas públicas (Igual que tu código)
        EXCLUDED_PATHS = ["/api/v1/auth/login", "/api/v1/auth/register/client", "/api/v1/auth/register/employee", "/docs", "/redoc", "/openapi.json"]
        PUBLIC_GET_PATHS = ["/api/v1/products", "/api/v1/services", "/api/v1/comments", "/api/v1/orders"]

        if any(request.url.path.startswith(p) for p in EXCLUDED_PATHS) or \
           (request.method == "GET" and any(request.url.path.startswith(p) for p in PUBLIC_GET_PATHS)):
            return await call_next(request)

        # 2. Validar Header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Token de autenticación faltante"}, 401)

        token = auth_header.split(" ")[1]

        try:
            # 3. Decodificar JWT
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            
            if user_id is None:
                return JSONResponse({"detail": "Token inválido: sub missing"}, 401)

            # 4. VALIDACIÓN DE SESIÓN EN DB (Crucial)
            db = SessionLocal()
            try:
                session_db = db.query(UserSession).filter(
                    UserSession.user_id == user_id,
                    UserSession.token == token,
                    UserSession.is_active == True
                ).first()
                
                # SI NO HAY SESIÓN ACTIVA EN DB -> 401
                if not session_db:
                    return JSONResponse({"detail": "Sesión inválida, cerrada o inexistente en base de datos"}, 401)
            finally:
                db.close()

            # 5. Inyectar info en el 'state'
            request.state.user_id = user_id
            request.state.token = token # Inyectamos el token para usarlo en dependencias si es necesario
            request.state.user_type = payload.get("type")
            request.state.user_role = payload.get("role")

        except JWTError:
            return JSONResponse({"detail": "Token expirado o corrupto"}, 401)
 
        return await call_next(request)
