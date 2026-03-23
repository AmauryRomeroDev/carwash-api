from fastapi import FastAPI
from app.api.v1.main import router as api_v1_router
from app.middleware.auth_middleware import AuthMiddleware 

app = FastAPI(title="Carwash API", version="1.0.0")

# 1. Middlewares
app.add_middleware(AuthMiddleware)

# 2. Rutas
app.include_router(api_v1_router, prefix="/api/v1")
