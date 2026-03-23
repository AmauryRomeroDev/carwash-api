from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.staff import router as staff_router 

router = APIRouter()

# Incluir sub-routers
router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(staff_router, prefix="/staff", tags=["Staff"])
