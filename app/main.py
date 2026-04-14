from fastapi import FastAPI,Depends
from fastapi.staticfiles import StaticFiles
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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# 2. Verificar que la carpeta exista (opcional, ayuda a depurar)
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)
    print(f"Carpeta creada en: {STATIC_DIR}")

# 3. Montar con la ruta absoluta
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static") 
  
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
