from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
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

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 3. Agrega el middleware de CORS antes que el de Auth
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 1. Middlewares
app.add_middleware(AuthMiddleware)

# 2. Rutas
app.include_router(
    api_v1_router, 
    prefix="/api/v1",
)
