from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.staff_services import router as staff_service_router 
from app.api.v1.staff_products import router as staff_product_router
from app.api.v1.vehicle import router as vehicle_router
from app.api.v1.services import router as service_router
from app.api.v1.products import router as product_router
from app.api.v1.comments import router as comment_router


router = APIRouter()

# Incluir sub-routers
router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(staff_service_router, prefix="/staff", tags=["Staff - Services"])
router.include_router(staff_product_router, prefix="/staff", tags=["Staff - Products"])
router.include_router(vehicle_router, prefix="/vehicles", tags=["Vehicles"])
router.include_router(service_router, prefix="/services", tags=["Services"])
router.include_router(product_router, prefix="/products", tags=["Inventory"])
router.include_router(comment_router, prefix="/comments", tags=["Comments & Reviews"])
