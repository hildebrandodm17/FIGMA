from fastapi import APIRouter

from app.api.v1.superadmin import dashboard, empresas

router = APIRouter(prefix="/superadmin", tags=["SuperAdmin"])

router.include_router(dashboard.router)
router.include_router(empresas.router)
