from fastapi import FastAPI,Depends
from app.api.v1.main import router as api_v1_router
from app.middleware.auth_middleware import AuthMiddleware 
from app.core.dependencies import oauth2_scheme

# Configuración para que aparezca el botón Authorize (Candado)
app = FastAPI(
    title="Carwash API", 
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
    openapi_extra={
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                }
            }
        },
        "security": [{"BearerAuth": []}]
    }
)

# 1. Middlewares
app.add_middleware(AuthMiddleware)

# 2. Rutas
app.include_router(
    api_v1_router, 
    prefix="/api/v1",
)
