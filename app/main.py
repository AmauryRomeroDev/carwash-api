from fastapi import FastAPI
from app.api.v1.main import router
from app.middleware.auth_middleware import AuthMiddleware 

app = FastAPI(title="Carwash API", version="1.0.0")

app.add_middleware(AuthMiddleware)

app.include_router(router, prefix="/api/v1")
