# app/middlewares/auth.py
import os
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rutas públicas (No cambian)
        EXCLUDED_PATHS = [
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/docs",
            "/openapi.json",
        ]
        if request.url.path in EXCLUDED_PATHS:
            return await call_next(request)

        # 2. Obtener el token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Token de autenticación faltante"}, 401)

        token = auth_header.split(" ")[1]

        try:
            # 3. Decodificar Token 
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")

            if user_id is None:
                return JSONResponse({"detail": "Token inválido: sub missing"}, 401)

            # 4. Inyectar solo la info del token en el 'state'
            request.state.user_id = user_id
            request.state.user_type = payload.get("type")  # Si lo guardaste en el JWT
            request.state.user_role = payload.get("role")  # Si lo guardaste en el JWT

        except JWTError:
            return JSONResponse({"detail": "Token expirado o corrupto"}, 401)

        # 5. Continuar la petición
        return await call_next(request)
