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


# app/middlewares/auth_middleware.py

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 0. EXCLUIR MÉTODO OPTIONS
        if request.method == "OPTIONS":
            return await call_next(request)

        # 1. Rutas públicas (sin autenticación)
        EXCLUDED_PATHS = [
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/register/employee",
            "/static",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
        
        # Rutas GET públicas (sin autenticación)
        PUBLIC_GET_PATHS = [
            "/api/v1/products",
            "/api/v1/services",
            "/api/v1/comments",  # GET público para comentarios aprobados
            "/api/v1/orders",
        ]
        
        # Rutas que requieren autenticación pero NO validación de sesión en DB
        # (para rutas admin que ya tienen su propia validación)
        AUTH_PATHS_NO_SESSION_CHECK = [
            "/api/v1/comments/admin",
            "/api/v1/comments/pending",
            "/api/v1/comments/approve",
            "/api/v1/comments/reject",
            "/api/v1/comments/restore",
        ]
        
        # Verificar si es ruta GET pública
        is_public_get = (
            request.method == "GET" 
            and any(request.url.path.startswith(p) for p in PUBLIC_GET_PATHS)
            and not request.url.path.endswith("/me")
            and not any(request.url.path.startswith(p) for p in AUTH_PATHS_NO_SESSION_CHECK)
        )

        # Si es ruta excluida o GET público, pasar directamente
        if any(request.url.path.startswith(p) for p in EXCLUDED_PATHS) or is_public_get:
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

            # 4. Verificar si es ruta que NO necesita validación de sesión en DB
            is_auth_path_no_session = any(
                request.url.path.startswith(p) for p in AUTH_PATHS_NO_SESSION_CHECK
            )
            
            if not is_auth_path_no_session:
                # VALIDACIÓN DE SESIÓN EN DB (solo para rutas que no son admin)
                db = SessionLocal()
                try:
                    session_db = (
                        db.query(UserSession)
                        .filter(
                            UserSession.user_id == user_id,
                            UserSession.token == token,
                            UserSession.is_active == True,
                        )
                        .first()
                    )

                    if not session_db:
                        return JSONResponse(
                            {
                                "detail": "Sesión inválida, cerrada o inexistente en base de datos"
                            },
                            401,
                        )
                finally:
                    db.close()

            # 5. Inyectar info en el 'state'
            request.state.user_id = user_id
            request.state.token = token
            request.state.user_type = payload.get("type")
            request.state.user_role = payload.get("role")

        except JWTError:
            return JSONResponse({"detail": "Token expirado o corrupto"}, 401)

        return await call_next(request)