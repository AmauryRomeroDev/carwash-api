from fastapi import FastAPI,Depends
from app.api.v1.main import router as api_v1_router
from app.middleware.auth_middleware import AuthMiddleware 
from app.core.dependencies import oauth2_scheme
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Configuración inicial

load_dotenv()

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
  
  
# 0. CORS
origins_str= os.getenv("ALLOWED_ORIGINS","http://127.0.0.1:8000")
origins=origins_str.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins= origins,
    allow_credentials= True, 
    allow_methods=["*"],
    allow_headers=["*"]
)

# 1. Middlewares
app.add_middleware(AuthMiddleware)

# 2. Rutas
app.include_router(
    api_v1_router, 
    prefix="/api/v1",
)
